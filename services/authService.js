import { User } from '../models/User.js';
import { PendingUser } from '../models/PendingUser.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendResetPasswordEmail, sendRegistrationOtpEmail, sendLogin2FAOtpEmail } from './emailService.js';
import { formatUserResponse } from './userService.js';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
const generatePending2FAToken = (userId, email) =>
  jwt.sign(
    { id: userId, email, purpose: '2fa_pending' },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );

const verifyPending2FAToken = (pendingToken, email) => {
  try {
    const decoded = jwt.verify(pendingToken, process.env.JWT_SECRET || 'secret');
    if (decoded.purpose !== '2fa_pending') throw new Error('Invalid verification session');
    if (decoded.email !== email.toLowerCase().trim()) throw new Error('Invalid verification session');
    return decoded;
  } catch {
    throw new Error('Verification session expired. Please log in again.');
  }
};

const issueLoginOtp = async (user) => {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.loginOtpCode = otpCode;
  user.loginOtpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();
  await sendLogin2FAOtpEmail(user.email, user.name, otpCode);
  return generatePending2FAToken(user._id, user.email);
};

export const registerUser = async (data) => {
  const normalizedEmail = data.email.toLowerCase().trim();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new Error('User already exists');

  const passwordHash = await hashPassword(data.password);
  
  // Generate random 6-digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Upsert pending registration details in PendingUser collection
  await PendingUser.findOneAndDelete({ email: normalizedEmail });
  await PendingUser.create({
    email: normalizedEmail,
    name: data.name.trim(),
    passwordHash,
    academicYear: data.academicYear || '1st Year',
    monthlyAllowanceBaseline: Number(data.monthlyAllowance) || 0,
    monthlySavingsGoal: Number(data.savingsGoal) || 0,
    currency: data.currency || 'PKR',
    otpCode
  });

  // Send OTP email
  await sendRegistrationOtpEmail(normalizedEmail, data.name, otpCode);

  return { email: normalizedEmail, requiresOtp: true };
};

export const verifyRegistrationOtp = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const pendingUser = await PendingUser.findOne({ email: normalizedEmail });
  if (!pendingUser) {
    throw new Error('OTP has expired or registration request was not found. Please register again.');
  }

  if (pendingUser.otpCode !== otp.trim()) {
    throw new Error('Invalid OTP code. Please check your email and try again.');
  }

  // Create real user in Database
  const user = await User.create({
    name: pendingUser.name,
    email: pendingUser.email,
    passwordHash: pendingUser.passwordHash,
    academicYear: pendingUser.academicYear,
    monthlyAllowanceBaseline: pendingUser.monthlyAllowanceBaseline,
    monthlySavingsGoal: pendingUser.monthlySavingsGoal,
    currency: pendingUser.currency,
    isActive: true
  });

  // Delete pending user record
  await PendingUser.findOneAndDelete({ email: normalizedEmail });

  const token = generateToken(user._id);
  return { user: formatUserResponse(user), token };
};

export const resendRegistrationOtp = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const pendingUser = await PendingUser.findOne({ email: normalizedEmail });
  
  if (!pendingUser) {
    throw new Error('No pending registration found for this email. Please register again.');
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  pendingUser.otpCode = newOtp;
  pendingUser.createdAt = Date.now();
  await pendingUser.save();

  await sendRegistrationOtpEmail(normalizedEmail, pendingUser.name, newOtp);
  return { email: normalizedEmail };
};


export const loginUser = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user || !(await comparePassword(password, user.passwordHash))) throw new Error('Invalid email or password');
  if (user.role === 'admin') throw new Error('Invalid email or password'); // Reject admin accounts
  if (!user.isActive) throw new Error('Invalid email or password'); // Generic — don't reveal disabled state

  if (user.twoFactorEnabled) {
    const pendingToken = await issueLoginOtp(user);
    return {
      requires2FA: true,
      email: user.email,
      pendingToken
    };
  }

  const token = generateToken(user._id);
  return { requires2FA: false, user: formatUserResponse(user), token };
};

export const verifyLoginOtp = async (email, otp, pendingToken) => {
  const normalizedEmail = email.toLowerCase().trim();
  const decoded = verifyPending2FAToken(pendingToken, normalizedEmail);

  const user = await User.findOne({
    _id: decoded.id,
    email: normalizedEmail,
    loginOtpExpires: { $gt: Date.now() }
  }).select('+loginOtpCode');

  if (!user || !user.twoFactorEnabled || user.loginOtpCode !== otp.trim()) {
    throw new Error('Invalid or expired OTP code');
  }
  if (!user.isActive) throw new Error('Invalid or expired OTP code');

  user.loginOtpCode = undefined;
  user.loginOtpExpires = undefined;
  await user.save();

  const token = generateToken(user._id);
  return { user: formatUserResponse(user), token };
};

export const resendLoginOtp = async (email, pendingToken) => {
  const normalizedEmail = email.toLowerCase().trim();
  const decoded = verifyPending2FAToken(pendingToken, normalizedEmail);

  const user = await User.findById(decoded.id);
  if (!user || !user.twoFactorEnabled || !user.isActive) {
    throw new Error('Unable to resend OTP. Please log in again.');
  }

  const newPendingToken = await issueLoginOtp(user);
  return { email: user.email, pendingToken: newPendingToken };
};

export const adminLoginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await comparePassword(password, user.passwordHash))) throw new Error('Invalid email or password');
  if (user.role !== 'admin') throw new Error('Invalid email or password'); // Reject student accounts
  if (!user.isActive) throw new Error('Invalid email or password'); // Generic — don't reveal disabled state
  const token = generateToken(user._id);
  return { user: formatUserResponse(user), token };
};

export const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return; // Do not throw error to avoid user enumeration
  
  // Generate 6-digit OTP code for Password Reset
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOtpCode = otpCode;
  user.resetOtpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes expiry
  await user.save();

  await sendResetPasswordEmail(user.email, user.name, otpCode);
};

export const resetPassword = async (email, otp, newPassword) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({
    email: normalizedEmail,
    resetOtpExpires: { $gt: Date.now() }
  }).select('+resetOtpCode');
  
  if (!user || user.resetOtpCode !== otp.trim()) {
    throw new Error('Invalid or expired OTP code');
  }
  
  user.passwordHash = await hashPassword(newPassword);
  user.resetOtpCode = undefined;
  user.resetOtpExpires = undefined;
  await user.save();
};
import fs from 'fs';
import path from 'path';
import { User } from '../models/User.js';
import { toCents, toAmount } from '../utils/money.js';
import { comparePassword, hashPassword } from '../utils/crypto.js';
import { avatarsDir } from '../middleware/upload.js';

export const formatUserResponse = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  if (obj.passwordHash) delete obj.passwordHash;
  if (obj.resetTokenHash) delete obj.resetTokenHash;
  if (obj.resetTokenExpires) delete obj.resetTokenExpires;
  
  // Convert cents to display dollars
  if (obj.monthlyAllowanceBaseline !== undefined) obj.monthlyAllowanceBaseline = toAmount(obj.monthlyAllowanceBaseline);
  if (obj.monthlySavingsGoal !== undefined) obj.monthlySavingsGoal = toAmount(obj.monthlySavingsGoal);
  
  return obj;
};

const deleteLocalAvatar = (avatarPath) => {
  if (!avatarPath || !avatarPath.startsWith('/uploads/avatars/')) return;
  const filename = path.basename(avatarPath);
  const fullPath = path.join(avatarsDir, filename);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error('Failed to delete old avatar', err);
    }
  }
};

/**
 * User Service
 * Business logic layer for retrieving and updating student user profile.
 */

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }
  return formatUserResponse(user);
};

export const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }

  // Update allowed fields
  if (updateData.name !== undefined) user.name = updateData.name;
  if (updateData.academicYear !== undefined) user.academicYear = updateData.academicYear;
  if (updateData.currency !== undefined) user.currency = updateData.currency;

  // Convert amounts to cents integer before saving
  if (updateData.monthlyAllowanceBaseline !== undefined) {
    user.monthlyAllowanceBaseline = toCents(updateData.monthlyAllowanceBaseline);
  }
  if (updateData.monthlySavingsGoal !== undefined) {
    user.monthlySavingsGoal = toCents(updateData.monthlySavingsGoal);
  }

  await user.save();
  return formatUserResponse(user);
};

export const updateUserAvatar = async (userId, filename) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }

  const previous = user.avatar;
  user.avatar = `/uploads/avatars/${filename}`;
  await user.save();
  deleteLocalAvatar(previous);
  return formatUserResponse(user);
};

export const setTwoFactorEnabled = async (userId, enabled) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }

  user.twoFactorEnabled = Boolean(enabled);
  if (!user.twoFactorEnabled) {
    user.loginOtpCode = undefined;
    user.loginOtpExpires = undefined;
  }
  await user.save();
  return formatUserResponse(user);
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 403;
    throw error;
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return { message: 'Password changed successfully' };
};

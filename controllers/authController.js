import * as authService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Cookie options — secure flag only in production (HTTPS), sameSite explicit
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: (parseInt(process.env.COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000
});

export const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    sendSuccess(res, 'Verification OTP sent to your email. Please verify to complete registration.', result, 200);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { user, token } = await authService.verifyRegistrationOtp(req.body.email, req.body.otp);
    res.cookie('jwt', token, cookieOptions());
    sendSuccess(res, 'Account verified and created successfully!', user, 201);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

export const resendOtp = async (req, res) => {
  try {
    const result = await authService.resendRegistrationOtp(req.body.email);
    sendSuccess(res, 'Verification OTP resent to your email.', result);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};


export const login = async (req, res) => {
  try {
    const { user, token } = await authService.loginUser(req.body.email, req.body.password);
    res.cookie('jwt', token, cookieOptions());
    sendSuccess(res, 'Logged in successfully', user);
  } catch (err) {
    sendError(res, 401, err.message);
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { user, token } = await authService.adminLoginUser(req.body.email, req.body.password);
    res.cookie('jwt', token, cookieOptions());
    sendSuccess(res, 'Admin logged in successfully', user);
  } catch (err) {
    sendError(res, 401, err.message);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict' });
  sendSuccess(res, 'Logged out successfully');
};


export const forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);
    // Ignore error to prevent user enumeration, always send success
    sendSuccess(res, 'If your email is registered, a password reset OTP code has been sent to it.');
  } catch (err) {
    sendSuccess(res, 'If your email is registered, a password reset OTP code has been sent to it.');
  }
};

export const resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
    sendSuccess(res, 'Password has been reset successfully.');
  } catch (err) {
    sendError(res, 400, err.message);
  }
};
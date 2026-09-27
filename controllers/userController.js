import * as userService from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    sendSuccess(res, 'Profile retrieved', user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    sendSuccess(res, 'Profile updated', user);
  } catch (err) {
    next(err);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    const user = await userService.updateUserAvatar(req.user.id, req.file.filename);
    sendSuccess(res, 'Profile picture updated', user);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await userService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, 'Password changed successfully', result);
  } catch (err) {
    next(err);
  }
};

export const updateTwoFactor = async (req, res, next) => {
  try {
    const user = await userService.setTwoFactorEnabled(req.user.id, req.body.enabled);
    sendSuccess(
      res,
      req.body.enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
      user
    );
  } catch (err) {
    next(err);
  }
};
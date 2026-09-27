import fs from 'fs';
import path from 'path';

const files = {
  'config/constants.js': `
export const ROLES = { STUDENT: 'student', ADMIN: 'admin' };
export const CURRENCIES = { USD: 'USD', EUR: 'EUR', GBP: 'GBP' };
export const HTTP_STATUS = { OK: 200, CREATED: 201, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, INTERNAL_SERVER_ERROR: 500 };
  `,
  'config/db.js': `
import mongoose from 'mongoose';
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_coin');
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};
  `,
  'utils/response.js': `
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};
export const sendError = (res, statusCode, message, errors = null) => {
  res.status(statusCode).json({ success: false, error: message, errors });
};
  `,
  'middleware/errorHandler.js': `
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Server Error' });
};
  `,
  'middleware/auth.js': `
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
export const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;
    if (!token) return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) return res.status(401).json({ success: false, error: 'User not found' });
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Not authorized, token failed' });
  }
};
  `,
  'middleware/rateLimiter.js': `
import rateLimit from 'express-rate-limit';
export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' });
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many auth requests' });
  `,
  'middleware/validate.js': `
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).json({ success: false, error: err.errors });
  }
};
  `,
  'utils/crypto.js': `
import bcrypt from 'bcryptjs';
export const hashPassword = async (password) => await bcrypt.hash(password, 10);
export const comparePassword = async (password, hash) => await bcrypt.compare(password, hash);
  `,
  'utils/money.js': `
export const toCents = (amount) => Math.round(amount * 100);
export const fromCents = (cents) => cents / 100;
  `,
  'services/authService.js': `
import { User } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

export const registerUser = async (data) => {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new Error('User already exists');
  const passwordHash = await hashPassword(data.password);
  const user = await User.create({ ...data, passwordHash });
  const token = generateToken(user._id);
  return { user, token };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await comparePassword(password, user.passwordHash))) throw new Error('Invalid credentials');
  const token = generateToken(user._id);
  return { user, token };
};
  `,
  'controllers/authController.js': `
import * as authService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const register = async (req, res) => {
  try {
    const { user, token } = await authService.registerUser(req.body);
    res.cookie('jwt', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    sendSuccess(res, 'Registered successfully', user, 201);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

export const login = async (req, res) => {
  try {
    const { user, token } = await authService.loginUser(req.body.email, req.body.password);
    res.cookie('jwt', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    sendSuccess(res, 'Logged in successfully', user);
  } catch (err) {
    sendError(res, 401, err.message);
  }
};
  `,
  'routes/authRoutes.js': `
import express from 'express';
import { register, login } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';
const router = express.Router();
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
export default router;
  `,
  'controllers/userController.js': `
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    sendSuccess(res, 'Profile retrieved', user);
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true });
    sendSuccess(res, 'Profile updated', user);
  } catch (err) {
    sendError(res, 400, err.message);
  }
};
  `,
  'routes/userRoutes.js': `
import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();
router.use(requireAuth);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
export default router;
  `,
  'validators/authValidator.js': `
import { z } from 'zod';
export const registerSchema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string() });
  `
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join('d:/Campus-coin/server', filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}
console.log('Restored empty files');

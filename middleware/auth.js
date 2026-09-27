import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
export const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;
    if (!token) return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) return res.status(401).json({ success: false, error: 'User not found' });
    if (!req.user.isActive) return res.status(403).json({ success: false, error: 'Account is disabled. Contact admin.' });
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Not authorized, token failed' });
  }
};
export const protect = requireAuth;
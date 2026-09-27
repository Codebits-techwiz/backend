import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

export const apiLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: parseInt(process.env.API_RATE_LIMIT_MAX) || 300, 
  message: 'Too many requests, please try again later.',
  keyGenerator: (req) => {
    let token = req.cookies?.jwt;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded && decoded.id) {
          return decoded.id.toString();
        }
      } catch (err) {}
    }
    return req.ip;
  }
});

export const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20,  
  message: 'Too many auth attempts, please try again later.',
  skip: (req, res) => {
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || req.hostname === 'localhost');
  }
});

export const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many chat requests, please try again later.',
  skip: (req, res) => {
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || req.hostname === 'localhost');
  }
});
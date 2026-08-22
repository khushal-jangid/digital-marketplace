import mongoose from 'mongoose';
import User from '../models/User.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';
import { verifyJwt } from '../config/jwt.js';

/**
 * Protect routes: requires valid JWT bearer token
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, code: 'AUTH_TOKEN_MISSING', message: 'Not authorized, no token provided' });
      }

      // Verify token using centralized JWT config
      const decoded = verifyJwt(token);

      if (!decoded || !decoded.id) {
        return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Invalid authorization token' });
      }

      // Look up user from database
      if (mongoose.Types.ObjectId.isValid(decoded.id)) {
        req.user = await User.findById(decoded.id).select('-password');
      }

      // In development mock mode only
      if (!req.user && !isDbConnected()) {
        req.user = mockDb.users.find((u) => u._id === decoded.id);
      }

      if (!req.user) {
        return res.status(401).json({ success: false, code: 'USER_NOT_FOUND', message: 'Not authorized: User account no longer exists' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: error.name === 'TokenExpiredError' ? 'Authorization token expired' : 'Not authorized, token verification failed',
      });
    }
  }

  return res.status(401).json({ success: false, code: 'AUTH_TOKEN_REQUIRED', message: 'Not authorized, Bearer token required' });
};

/**
 * Admin authorization check
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    code: 'FORBIDDEN_ADMIN_ONLY',
    message: 'Access Denied: Administrator privileges required.',
  });
};

export default {
  protect,
  admin,
};

import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';
import { signJwt } from '../config/jwt.js';

// Generate JWT Token using centralized configuration
const generateToken = (id) => {
  return signJwt({ id }, { expiresIn: '30d' });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const { name, email, password, referralCode } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Please provide name, email, and password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EMAIL',
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'PASSWORD_TOO_SHORT',
        message: 'Password must be at least 6 characters long',
      });
    }

    if (!isDbConnected()) {
      const userExists = mockDb.users.some((u) => u.email === cleanEmail);
      if (userExists) {
        return res.status(400).json({
          success: false,
          code: 'USER_EXISTS',
          message: 'User already exists with this email',
        });
      }

      let referredByUser = null;
      if (referralCode) {
        referredByUser = mockDb.users.find((u) => u.referralCode === referralCode.trim().toUpperCase());
        if (referredByUser) {
          referredByUser.referralEarnings = (referredByUser.referralEarnings || 0) + 100;
        }
      }

      const user = {
        _id: `user_mock_${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        role: 'user',
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        referralEarnings: 0,
        wishlist: [],
        createdAt: new Date(),
      };

      mockDb.users.push(user);

      return res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        token: generateToken(user._id),
      });
    }

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        code: 'USER_EXISTS',
        message: 'User already exists with this email',
      });
    }

    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'user',
      referredBy: referredByUser ? referredByUser._id : null,
    });

    if (user) {
      if (referredByUser) {
        referredByUser.referralEarnings = (referredByUser.referralEarnings || 0) + 100;
        await referredByUser.save();
      }

      return res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        token: generateToken(user._id),
      });
    }

    return res.status(400).json({ success: false, code: 'REGISTRATION_FAILED', message: 'Invalid user data provided' });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isDbConnected()) {
      const user = mockDb.users.find((u) => u.email === cleanEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        });
      }

      return res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        token: generateToken(user._id),
      });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (user && (await user.matchPassword(password))) {
      return res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        token: generateToken(user._id),
      });
    }

    return res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const user = mockDb.users.find((u) => u._id === req.user._id);
      if (user) {
        const wishlistDetails = (user.wishlist || [])
          .map((id) => mockDb.projects.find((p) => p._id === id))
          .filter(Boolean);

        return res.json({
          success: true,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          referralCode: user.referralCode,
          referralEarnings: user.referralEarnings || 0,
          wishlist: wishlistDetails,
          avatar: user.avatar || '',
          createdAt: user.createdAt || new Date(),
        });
      }
      return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const user = await User.findById(req.user._id).populate('wishlist');

    if (user) {
      return res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        referralEarnings: user.referralEarnings || 0,
        wishlist: user.wishlist,
        avatar: user.avatar || '',
        createdAt: user.createdAt,
      });
    }

    return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const user = mockDb.users.find((u) => u._id === req.user._id);
      if (user) {
        user.name = req.body.name ? req.body.name.trim() : user.name;
        user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
        return res.json({
          success: true,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          referralCode: user.referralCode,
          avatar: user.avatar || '',
          token: generateToken(user._id),
        });
      }
      return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name ? req.body.name.trim() : user.name;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

      if (req.body.password) {
        if (req.body.password.length < 6) {
          return res.status(400).json({
            success: false,
            code: 'PASSWORD_TOO_SHORT',
            message: 'Password must be at least 6 characters long',
          });
        }
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      return res.json({
        success: true,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        referralCode: updatedUser.referralCode,
        avatar: updatedUser.avatar || '',
        token: generateToken(updatedUser._id),
      });
    }

    return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Forgot Password - Request reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, code: 'INVALID_EMAIL', message: 'Valid email required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Prevent account enumeration by always returning generic success
    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        const rawResetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
      }
    }

    return res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been dispatched.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Reset Password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Valid reset token and new password (min 6 chars) required.',
      });
    }

    if (!isDbConnected()) {
      return res.json({ success: true, message: 'Password reset successfully (mock mode).' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_RESET_TOKEN',
        message: 'Password reset token is invalid or has expired.',
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You may now log in with your new password.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Get Wishlist
 * @route   GET /api/auth/wishlist
 * @access  Private
 */
export const getWishlist = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const user = mockDb.users.find((u) => u._id === req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
      }
      const wishlistDetails = (user.wishlist || [])
        .map((id) => mockDb.projects.find((p) => p._id === id))
        .filter(Boolean);
      return res.json({ success: true, wishlist: wishlistDetails });
    }

    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    }
    return res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Toggle item in wishlist
 * @route   POST /api/auth/wishlist
 * @access  Private
 */
export const toggleWishlist = async (req, res) => {
  const { projectId } = req.body;

  try {
    if (!projectId) {
      return res.status(400).json({ success: false, code: 'PROJECT_ID_REQUIRED', message: 'Project ID is required' });
    }

    if (!isDbConnected()) {
      const user = mockDb.users.find((u) => u._id === req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
      }

      if (!user.wishlist) user.wishlist = [];
      const index = user.wishlist.indexOf(projectId);
      let isAdded = false;

      if (index > -1) {
        user.wishlist.splice(index, 1);
      } else {
        user.wishlist.push(projectId);
        isAdded = true;
      }

      return res.json({ success: true, wishlist: user.wishlist, isAdded });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, code: 'INVALID_ID', message: 'Invalid project ID format' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const index = user.wishlist.indexOf(projectId);
    let isAdded = false;

    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(projectId);
      isAdded = true;
    }

    await user.save();
    return res.json({ success: true, wishlist: user.wishlist, isAdded });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

export default {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  getWishlist,
  toggleWishlist,
};

import Coupon from '../models/Coupon.js';
import Subscriber from '../models/Subscriber.js';
import { sendNewCouponEmail } from '../config/mail.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';
import couponService, { normalizeCouponCode } from '../services/couponService.js';

/**
 * @desc    Validate a coupon code
 * @route   POST /api/coupons/validate
 * @access  Public / Private
 */
export const validateCoupon = async (req, res) => {
  const { code, cartAmount, cartItems } = req.body;

  try {
    if (!code) {
      return res.status(400).json({
        success: false,
        code: 'COUPON_CODE_REQUIRED',
        message: 'Coupon code is required',
      });
    }

    const result = await couponService.validateCoupon({
      code,
      cartItems: Array.isArray(cartItems) ? cartItems : [],
      subtotal: cartAmount !== undefined && !isNaN(cartAmount) ? Number(cartAmount) : null,
    });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        code: result.code || 'COUPON_INVALID',
        message: result.message,
      });
    }

    return res.json({
      success: true,
      coupon: result.coupon,
      subtotal: result.subtotal,
      eligibleSubtotal: result.eligibleSubtotal,
      discount: result.discount,
      finalTotal: result.finalTotal,
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
};

/**
 * @desc    Create a new coupon or VIP Gift Voucher (Admin only)
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
export const createCoupon = async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    expiryDate,
    startDate,
    usageLimit,
    targetProject,
    targetProjectTitle,
    isGiftVoucher,
    notes,
  } = req.body;

  try {
    if (!code || discountValue === undefined || discountValue === '' || !expiryDate) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Please provide coupon code, discount value, and expiry date.',
      });
    }

    const cleanCode = normalizeCouponCode(code);
    const numDiscountValue = Number(discountValue);

    if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_DISCOUNT_VALUE',
        message: 'Discount value must be a positive number.',
      });
    }

    const type = discountType === 'fixed' ? 'fixed' : 'percentage';
    if (type === 'percentage' && numDiscountValue > 100) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PERCENTAGE',
        message: 'Percentage discount cannot exceed 100%.',
      });
    }

    const formattedExpiryDate = new Date(expiryDate);
    formattedExpiryDate.setHours(23, 59, 59, 999);

    const parsedMinOrder = minOrderAmount !== undefined && minOrderAmount !== '' && !isNaN(minOrderAmount) ? Number(minOrderAmount) : 0;
    const parsedMaxDiscount = maxDiscount !== undefined && maxDiscount !== '' && !isNaN(maxDiscount) ? Number(maxDiscount) : null;
    const parsedUsageLimit = usageLimit !== undefined && usageLimit !== '' && !isNaN(usageLimit) ? Number(usageLimit) : null;
    const parsedTargetProject = targetProject && targetProject !== 'all' ? targetProject : null;
    const parsedTargetTitle = targetProjectTitle || (parsedTargetProject ? 'Selected Project' : 'All Projects');

    if (!isDbConnected()) {
      const couponExists = mockDb.coupons.some((c) => c.code === cleanCode);
      if (couponExists) {
        return res.status(400).json({ success: false, code: 'COUPON_EXISTS', message: 'Coupon code already exists' });
      }

      const coupon = {
        _id: `coupon_mock_${Date.now()}`,
        code: cleanCode,
        discountType: type,
        discountValue: numDiscountValue,
        minOrderAmount: parsedMinOrder,
        maxDiscount: parsedMaxDiscount,
        expiryDate: formattedExpiryDate,
        startDate: startDate ? new Date(startDate) : new Date(),
        usageLimit: parsedUsageLimit,
        usedCount: 0,
        isActive: true,
        targetProject: parsedTargetProject,
        targetProjectTitle: parsedTargetTitle,
        isGiftVoucher: Boolean(isGiftVoucher),
        notes: (notes || '').trim(),
        createdAt: new Date(),
      };

      mockDb.coupons.push(coupon);
      return res.status(201).json({ success: true, message: 'Coupon created successfully!', coupon });
    }

    const couponExists = await Coupon.findOne({ code: cleanCode });
    if (couponExists) {
      return res.status(400).json({ success: false, code: 'COUPON_EXISTS', message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      discountType: type,
      discountValue: numDiscountValue,
      minOrderAmount: parsedMinOrder,
      maxDiscount: parsedMaxDiscount,
      expiryDate: formattedExpiryDate,
      startDate: startDate ? new Date(startDate) : new Date(),
      usageLimit: parsedUsageLimit,
      targetProject: parsedTargetProject,
      targetProjectTitle: parsedTargetTitle,
      isGiftVoucher: Boolean(isGiftVoucher),
      notes: (notes || '').trim(),
    });

    // Notify subscribers only for global promotional coupons, NOT for private gift vouchers
    if (!isGiftVoucher) {
      Subscriber.find({})
        .then((subs) => {
          if (subs && subs.length > 0) {
            sendNewCouponEmail(subs, coupon).catch(() => {});
          }
        })
        .catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: isGiftVoucher ? '🎁 VIP Gift Voucher created successfully!' : 'Coupon created successfully!',
      coupon,
    });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Update/Edit an existing coupon or gift voucher (Admin only)
 * @route   PUT /api/coupons/:id
 * @access  Private/Admin
 */
export const updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      expiryDate,
      usageLimit,
      isActive,
      targetProject,
      targetProjectTitle,
      isGiftVoucher,
      notes,
    } = req.body;

    if (!isDbConnected()) {
      const idx = mockDb.coupons.findIndex((c) => c._id === couponId || c.id === couponId);
      if (idx === -1) {
        return res.status(404).json({ success: false, code: 'COUPON_NOT_FOUND', message: 'Coupon not found' });
      }
      if (code) mockDb.coupons[idx].code = normalizeCouponCode(code);
      if (discountValue !== undefined && !isNaN(discountValue)) mockDb.coupons[idx].discountValue = Number(discountValue);
      if (discountType) mockDb.coupons[idx].discountType = discountType;
      if (expiryDate) mockDb.coupons[idx].expiryDate = new Date(expiryDate);
      if (usageLimit !== undefined) mockDb.coupons[idx].usageLimit = usageLimit !== '' && usageLimit !== null ? Number(usageLimit) : null;
      if (isActive !== undefined) mockDb.coupons[idx].isActive = Boolean(isActive);
      if (targetProject !== undefined) mockDb.coupons[idx].targetProject = targetProject === 'all' ? null : targetProject;
      if (targetProjectTitle) mockDb.coupons[idx].targetProjectTitle = targetProjectTitle;
      if (isGiftVoucher !== undefined) mockDb.coupons[idx].isGiftVoucher = Boolean(isGiftVoucher);
      if (notes !== undefined) mockDb.coupons[idx].notes = notes.trim();

      return res.json({ success: true, message: 'Coupon updated successfully!', coupon: mockDb.coupons[idx] });
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, code: 'COUPON_NOT_FOUND', message: 'Coupon not found' });
    }

    if (code) {
      const cleanCode = normalizeCouponCode(code);
      if (cleanCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: cleanCode, _id: { $ne: couponId } });
        if (existing) {
          return res.status(400).json({ success: false, code: 'COUPON_EXISTS', message: 'Another coupon with this code already exists.' });
        }
        coupon.code = cleanCode;
      }
    }

    if (discountType) coupon.discountType = discountType === 'fixed' ? 'fixed' : 'percentage';
    if (discountValue !== undefined && !isNaN(discountValue)) {
      const val = Number(discountValue);
      if (val <= 0 || (coupon.discountType === 'percentage' && val > 100)) {
        return res.status(400).json({ success: false, code: 'INVALID_VALUE', message: 'Invalid discount value.' });
      }
      coupon.discountValue = val;
    }

    if (minOrderAmount !== undefined && !isNaN(minOrderAmount)) {
      coupon.minOrderAmount = Number(minOrderAmount);
    }

    if (maxDiscount !== undefined) {
      coupon.maxDiscount = maxDiscount !== '' && maxDiscount !== null && !isNaN(maxDiscount) ? Number(maxDiscount) : null;
    }

    if (expiryDate) {
      const exp = new Date(expiryDate);
      exp.setHours(23, 59, 59, 999);
      coupon.expiryDate = exp;
    }

    if (usageLimit !== undefined) {
      coupon.usageLimit = usageLimit !== '' && usageLimit !== null && !isNaN(usageLimit) ? Number(usageLimit) : null;
    }

    if (isActive !== undefined) {
      coupon.isActive = Boolean(isActive);
    }

    if (targetProject !== undefined) {
      coupon.targetProject = targetProject && targetProject !== 'all' ? targetProject : null;
      coupon.targetProjectTitle = targetProjectTitle || (coupon.targetProject ? 'Selected Project' : 'All Projects');
    }

    if (isGiftVoucher !== undefined) {
      coupon.isGiftVoucher = Boolean(isGiftVoucher);
    }

    if (notes !== undefined) {
      coupon.notes = notes.trim();
    }

    await coupon.save();
    return res.json({ success: true, message: 'Coupon / Voucher updated successfully!', coupon });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Get all coupons & vouchers (Admin only)
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
export const getCoupons = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ success: true, coupons: mockDb.coupons });
    }
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Delete a coupon/voucher (Admin only)
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
export const deleteCoupon = async (req, res) => {
  try {
    if (!isDbConnected()) {
      mockDb.coupons = mockDb.coupons.filter((c) => c._id !== req.params.id);
      return res.json({ success: true, message: 'Coupon deleted successfully' });
    }

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, code: 'COUPON_NOT_FOUND', message: 'Coupon not found' });
    }

    await Coupon.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Get the latest active coupon (Public)
 * @route   GET /api/coupons/latest-active
 * @access  Public
 */
export const getLatestActiveCoupon = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const activeCoupons = mockDb.coupons.filter(
        (c) =>
          c.isActive &&
          !c.isGiftVoucher &&
          c.discountValue < 100 &&
          !c.code.toUpperCase().startsWith('GIFT-') &&
          new Date() <= new Date(c.expiryDate)
      );
      const latest = activeCoupons.length > 0 ? activeCoupons[activeCoupons.length - 1] : null;
      return res.json({ success: true, coupon: latest });
    }

    // Strict Filter: Never expose private 100% free gift vouchers on public banners
    const latest = await Coupon.findOne({
      isActive: true,
      isGiftVoucher: { $ne: true },
      discountValue: { $lt: 100 },
      code: { $not: /^GIFT-/i },
      expiryDate: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    return res.json({ success: true, coupon: latest });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Generate a dynamic 10% coupon reward for daily bug game (Public)
 * @route   POST /api/coupons/generate-bug-reward
 * @access  Public
 */
export const generateBugReward = async (req, res) => {
  try {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `BUGBUSTER-${randomSuffix}`;

    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expiry.setHours(23, 59, 59, 999);

    if (!isDbConnected()) {
      const coupon = {
        _id: `coupon_mock_bug_${Date.now()}`,
        code,
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscount: null,
        expiryDate: expiry,
        usageLimit: 1,
        usedCount: 0,
        isActive: true,
        createdAt: new Date(),
      };

      mockDb.coupons.push(coupon);
      return res.status(201).json({ success: true, code, message: 'Reward coupon generated! Valid for 24 hours.' });
    }

    const coupon = await Coupon.create({
      code,
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: null,
      expiryDate: expiry,
      usageLimit: 1,
    });

    return res.status(201).json({ success: true, code: coupon.code, message: 'Reward coupon generated! Valid for 24 hours.' });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

export default {
  validateCoupon,
  createCoupon,
  updateCoupon,
  getCoupons,
  deleteCoupon,
  getLatestActiveCoupon,
  generateBugReward,
};

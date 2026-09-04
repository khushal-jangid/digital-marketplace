import Coupon from '../models/Coupon.js';
import FlashSale from '../models/FlashSale.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';

const KNOWN_PRESETS = {
  FLASH35: { discount: 35, title: 'Flash Deal 35% OFF' },
  DIWALI40: { discount: 40, title: 'Diwali Dhamaka 40% OFF' },
  HOLI35: { discount: 35, title: 'Holi Dhamaka 35% OFF' },
  REPUBLIC50: { discount: 50, title: 'Republic Day 50% OFF' },
  FREEDOM45: { discount: 45, title: 'Freedom Offer 45% OFF' },
  NEWYEAR45: { discount: 45, title: 'New Year 45% OFF' },
  EID35: { discount: 35, title: 'Eid Special 35% OFF' },
};

/**
 * Normalize coupon code (trim and uppercase)
 */
export const normalizeCouponCode = (code) => {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toUpperCase();
};

/**
 * Validate cart eligibility against a coupon
 * @param {Object} coupon 
 * @param {Array} cartItems 
 * @returns {{ eligible: boolean, eligibleItems: Array, eligibleSubtotal: number, reason?: string }}
 */
export const validateCartEligibility = (coupon, cartItems = []) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      eligible: false,
      eligibleItems: [],
      eligibleSubtotal: 0,
      reason: 'Cart is empty',
    };
  }

  // Calculate items subtotal
  const getItemPrice = (item) => {
    const base = Number(item.price || item.priceAtPurchase || 0);
    if (item.licenseType === 'commercial') {
      return Math.round(base * 2.2);
    }
    return base;
  };

  if (coupon.targetProject && coupon.targetProject.toString() !== 'all') {
    const targetIdStr = coupon.targetProject.toString();
    const matchingItems = cartItems.filter((item) => {
      const itemId = (item._id || item.project?._id || item.project || item.projectId || item.id || '').toString();
      return itemId === targetIdStr;
    });

    if (matchingItems.length === 0) {
      return {
        eligible: false,
        eligibleItems: [],
        eligibleSubtotal: 0,
        reason: `This coupon is exclusively valid for "${coupon.targetProjectTitle || 'selected project'}" only.`,
      };
    }

    const eligibleSubtotal = matchingItems.reduce((acc, item) => acc + getItemPrice(item), 0);
    return {
      eligible: true,
      eligibleItems: matchingItems,
      eligibleSubtotal,
    };
  }

  const eligibleSubtotal = cartItems.reduce((acc, item) => acc + getItemPrice(item), 0);
  return {
    eligible: true,
    eligibleItems: cartItems,
    eligibleSubtotal,
  };
};

/**
 * Calculate discount amount with strict boundaries
 * @param {Object} coupon 
 * @param {number} eligibleSubtotal 
 * @param {number} totalSubtotal 
 * @returns {{ discount: number, finalTotal: number }}
 */
export const calculateDiscount = (coupon, eligibleSubtotal, totalSubtotal) => {
  const subtotal = Math.max(0, Number(totalSubtotal) || 0);
  const eligible = Math.max(0, Math.min(Number(eligibleSubtotal) || 0, subtotal));
  let discount = 0;

  if (coupon.discountType === 'percentage') {
    const percent = Math.min(100, Math.max(0, Number(coupon.discountValue) || 0));
    discount = (eligible * percent) / 100;

    if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined && !isNaN(coupon.maxDiscount)) {
      const maxDisc = Math.max(0, Number(coupon.maxDiscount));
      discount = Math.min(discount, maxDisc);
    }
  } else if (coupon.discountType === 'fixed') {
    const fixedVal = Math.max(0, Number(coupon.discountValue) || 0);
    discount = Math.min(fixedVal, eligible);
  }

  // Ensure discount boundaries: 0 <= discount <= subtotal
  discount = Math.max(0, Math.min(Math.round(discount), subtotal));
  const finalTotal = Math.max(0, subtotal - discount);

  return {
    discount,
    finalTotal,
  };
};

/**
 * Authoritative server-side coupon validation
 * @param {Object} params
 * @param {string} params.code - Coupon code
 * @param {Array} params.cartItems - Items currently in cart
 * @param {number} [params.subtotal] - Optional provided subtotal (recomputed if cart items provided)
 * @returns {Promise<Object>} Validation result
 */
export const validateCoupon = async ({ code, cartItems = [], subtotal = null }) => {
  const cleanCode = normalizeCouponCode(code);
  if (!cleanCode) {
    return {
      valid: false,
      code: 'COUPON_CODE_REQUIRED',
      message: 'Coupon code is required',
    };
  }

  let coupon = null;

  // 1. Check Coupon Model in DB or Mock
  if (!isDbConnected()) {
    coupon = mockDb.coupons.find((c) => c.code === cleanCode);
  } else {
    coupon = await Coupon.findOne({ code: cleanCode });
  }

  // 2. Check Active Flash Sale / Festival Sale
  if (!coupon) {
    try {
      if (isDbConnected()) {
        const flashSale = await FlashSale.findOne({
          promoCode: cleanCode,
          isActive: true,
        });

        if (flashSale) {
          coupon = {
            code: cleanCode,
            discountType: 'percentage',
            discountValue: flashSale.discountPercentage || 35,
            minOrderAmount: 0,
            maxDiscount: null,
            expiryDate: flashSale.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
            startDate: new Date(),
            usageLimit: null,
            usedCount: 0,
            isActive: Boolean(flashSale.isActive),
            targetProject: flashSale.targetProject,
            targetProjectTitle: flashSale.targetProjectTitle || 'All Projects',
          };

          // Auto-sync into Coupon collection so it exists permanently
          Coupon.findOneAndUpdate(
            { code: cleanCode },
            { $set: coupon },
            { upsert: true, new: true }
          ).catch(() => {});
        } else {
          // Check latest active flash sale even if code casing is different
          const latestSale = await FlashSale.findOne().sort({ createdAt: -1 });
          if (latestSale && latestSale.isActive && normalizeCouponCode(latestSale.promoCode) === cleanCode) {
            coupon = {
              code: cleanCode,
              discountType: 'percentage',
              discountValue: latestSale.discountPercentage || 35,
              minOrderAmount: 0,
              maxDiscount: null,
              expiryDate: latestSale.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
              startDate: new Date(),
              usageLimit: null,
              usedCount: 0,
              isActive: Boolean(latestSale.isActive),
              targetProject: latestSale.targetProject,
              targetProjectTitle: latestSale.targetProjectTitle || 'All Projects',
            };
          }
        }
      } else {
        if (mockDb.flashSale && normalizeCouponCode(mockDb.flashSale.promoCode) === cleanCode) {
          coupon = {
            code: cleanCode,
            discountType: 'percentage',
            discountValue: mockDb.flashSale.discountPercentage || 35,
            minOrderAmount: 0,
            maxDiscount: null,
            expiryDate: mockDb.flashSale.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
            startDate: new Date(),
            usageLimit: null,
            usedCount: 0,
            isActive: mockDb.flashSale.isActive,
            targetProject: mockDb.flashSale.targetProject,
            targetProjectTitle: mockDb.flashSale.targetProjectTitle || 'All Projects',
          };
        }
      }
    } catch (_) {}
  }

  // 3. Check Known Festival / Flash Presets Fallback
  if (!coupon && KNOWN_PRESETS[cleanCode]) {
    const preset = KNOWN_PRESETS[cleanCode];
    coupon = {
      code: cleanCode,
      discountType: 'percentage',
      discountValue: preset.discount,
      minOrderAmount: 0,
      maxDiscount: null,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      startDate: new Date(),
      usageLimit: null,
      usedCount: 0,
      isActive: true,
      targetProject: null,
      targetProjectTitle: 'All Projects',
    };
  }

  if (!coupon) {
    return {
      valid: false,
      code: 'COUPON_NOT_FOUND',
      message: 'Invalid coupon code. Coupon does not exist.',
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      code: 'COUPON_INACTIVE',
      message: 'This coupon is currently inactive.',
    };
  }

  const now = new Date();

  // Check start date if defined
  if (coupon.startDate && now < new Date(coupon.startDate)) {
    return {
      valid: false,
      code: 'COUPON_NOT_STARTED',
      message: 'This coupon is not active yet.',
    };
  }

  // Check expiry date
  if (coupon.expiryDate && now > new Date(coupon.expiryDate)) {
    return {
      valid: false,
      code: 'COUPON_EXPIRED',
      message: 'This coupon has expired.',
    };
  }

  // Check usage limit
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
    if (coupon.usedCount >= coupon.usageLimit) {
      return {
        valid: false,
        code: 'COUPON_LIMIT_REACHED',
        message: 'This coupon has reached its maximum usage limit.',
      };
    }
  }

  // Calculate actual subtotal from cart items if provided
  let computedSubtotal = subtotal;
  if (computedSubtotal === null || computedSubtotal === undefined || computedSubtotal <= 0) {
    computedSubtotal = cartItems.reduce((acc, item) => {
      const base = Number(item.price || item.priceAtPurchase || 0);
      return acc + (item.licenseType === 'commercial' ? Math.round(base * 2.2) : base);
    }, 0);
  }

  // Check minimum order amount
  const minOrder = Number(coupon.minOrderAmount) || 0;
  if (computedSubtotal < minOrder) {
    return {
      valid: false,
      code: 'MINIMUM_ORDER_NOT_MET',
      message: `Minimum order amount of INR ${minOrder} is required to use this coupon.`,
      minOrderAmount: minOrder,
    };
  }

  // Check cart eligibility for target project
  const eligibility = validateCartEligibility(coupon, cartItems);
  if (!eligibility.eligible) {
    return {
      valid: false,
      code: 'COUPON_INELIGIBLE_PROJECT',
      message: eligibility.reason || 'This coupon cannot be applied to the items in your cart.',
      targetProject: coupon.targetProject,
      targetProjectTitle: coupon.targetProjectTitle,
    };
  }

  // Compute discount
  const { discount, finalTotal } = calculateDiscount(coupon, eligibility.eligibleSubtotal, computedSubtotal);

  return {
    valid: true,
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount || null,
      minOrderAmount: minOrder,
      targetProject: coupon.targetProject || null,
      targetProjectTitle: coupon.targetProjectTitle || 'All Projects',
    },
    subtotal: computedSubtotal,
    eligibleSubtotal: eligibility.eligibleSubtotal,
    discount,
    finalTotal,
    message: coupon.targetProjectTitle && coupon.targetProjectTitle !== 'All Projects'
      ? `Coupon "${coupon.code}" applied for ${coupon.targetProjectTitle}!`
      : `Coupon "${coupon.code}" applied successfully! (${coupon.discountValue}% OFF)`,
  };
};

/**
 * Atomically redeem coupon on verified order payment
 * @param {string} code 
 * @returns {Promise<boolean>} whether coupon was successfully incremented
 */
export const redeemCoupon = async (code) => {
  const cleanCode = normalizeCouponCode(code);
  if (!cleanCode) return false;

  if (!isDbConnected()) {
    const coupon = mockDb.coupons.find((c) => c.code === cleanCode && c.isActive);
    if (!coupon) return false;
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      return false;
    }
    coupon.usedCount = (coupon.usedCount || 0) + 1;
    return true;
  }

  try {
    const updated = await Coupon.findOneAndUpdate(
      {
        code: cleanCode,
        isActive: true,
        $or: [
          { usageLimit: null },
          { usageLimit: { $exists: false } },
          { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
        ],
      },
      {
        $inc: { usedCount: 1 },
      },
      { new: true }
    );

    return !!updated;
  } catch (err) {
    console.error('Failed to atomically redeem coupon:', err.message);
    return false;
  }
};

export default {
  normalizeCouponCode,
  validateCartEligibility,
  calculateDiscount,
  validateCoupon,
  redeemCoupon,
};

import FlashSale from '../models/FlashSale.js';
import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';

/**
 * @desc    Get active Festival / Flash Sale settings & countdown end time
 * @route   GET /api/flash-sale
 * @access  Public
 */
export const getFlashSale = async (req, res) => {
  try {
    let flashSale = null;

    if (isDbConnected()) {
      flashSale = await FlashSale.findOne().sort({ createdAt: -1 });
    } else {
      flashSale = mockDb.flashSale || null;
    }

    if (!flashSale || !flashSale.title) {
      return res.json({
        success: true,
        flashSale: {
          isActive: false,
          title: '',
          subtitle: '',
          promoCode: '',
          discountPercentage: 0,
          endTime: null,
          isExpired: true,
          targetProject: null,
          targetProjectTitle: 'All Projects',
          badge: '⚡ FLASH DEAL',
          festivalTheme: 'flash',
        },
      });
    }

    const isExpired = !flashSale.isActive || (flashSale.endTime && new Date() > new Date(flashSale.endTime));

    return res.json({
      success: true,
      flashSale: {
        _id: flashSale._id,
        isActive: Boolean(flashSale.isActive),
        title: flashSale.title,
        subtitle: flashSale.subtitle || '',
        promoCode: flashSale.promoCode || '',
        discountPercentage: flashSale.discountPercentage || 0,
        endTime: flashSale.endTime,
        targetProject: flashSale.targetProject || null,
        targetProjectTitle: flashSale.targetProjectTitle || 'All Projects',
        badge: flashSale.badge || '⚡ FLASH DEAL',
        festivalTheme: flashSale.festivalTheme || 'flash',
        isExpired,
      },
    });
  } catch (error) {
    console.error('Error fetching flash/festival sale:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Festival / Flash Sale configuration & auto-sync promo coupon for all projects (Admin only)
 * @route   PUT /api/flash-sale
 * @access  Private/Admin
 */
export const updateFlashSale = async (req, res) => {
  const {
    isActive,
    title,
    subtitle,
    promoCode,
    discountPercentage,
    endTime,
    targetProject,
    targetProjectTitle,
    badge,
    festivalTheme,
  } = req.body;

  try {
    const formattedCode = promoCode ? promoCode.trim().toUpperCase() : 'FLASH35';
    const discountVal = Number(discountPercentage) || 0;
    const parsedEndTime = endTime ? new Date(endTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const parsedTargetProject = targetProject && targetProject !== 'all' ? targetProject : null;
    const parsedTargetTitle = targetProjectTitle || (parsedTargetProject ? 'Selected Project' : 'All Projects');
    const isSaleActive = Boolean(isActive);
    const parsedBadge = badge ? badge.trim() : '⚡ FLASH DEAL';
    const parsedTheme = festivalTheme ? festivalTheme.trim() : 'flash';

    let flashSale = null;
    let oldPromoCode = null;

    if (isDbConnected()) {
      flashSale = await FlashSale.findOne();
      if (!flashSale) {
        flashSale = new FlashSale();
      }
      oldPromoCode = flashSale.promoCode;

      flashSale.isActive = isSaleActive;
      if (title !== undefined) flashSale.title = title;
      if (subtitle !== undefined) flashSale.subtitle = subtitle;
      flashSale.promoCode = formattedCode;
      flashSale.discountPercentage = discountVal;
      flashSale.endTime = parsedEndTime;
      flashSale.targetProject = parsedTargetProject;
      flashSale.targetProjectTitle = parsedTargetTitle;
      flashSale.badge = parsedBadge;
      flashSale.festivalTheme = parsedTheme;

      await flashSale.save();
    } else {
      if (!mockDb.flashSale) mockDb.flashSale = {};
      oldPromoCode = mockDb.flashSale.promoCode;
      mockDb.flashSale = {
        _id: 'mock_flash_sale',
        isActive: isSaleActive,
        title: title !== undefined ? title : mockDb.flashSale.title,
        subtitle: subtitle !== undefined ? subtitle : mockDb.flashSale.subtitle,
        promoCode: formattedCode,
        discountPercentage: discountVal,
        endTime: parsedEndTime,
        targetProject: parsedTargetProject,
        targetProjectTitle: parsedTargetTitle,
        badge: parsedBadge,
        festivalTheme: parsedTheme,
      };
      flashSale = mockDb.flashSale;
    }

    // 🌟 Auto-sync with Coupon system so the festival promo code works across the entire catalog!
    if (formattedCode && discountVal > 0) {
      const couponPayload = {
        code: formattedCode,
        discountType: 'percentage',
        discountValue: discountVal,
        minOrderAmount: 0,
        maxDiscount: null,
        expiryDate: parsedEndTime,
        startDate: new Date(),
        usageLimit: null,
        isActive: isSaleActive,
        targetProject: parsedTargetProject, // null means valid on ALL projects!
        targetProjectTitle: parsedTargetTitle,
      };

      if (isDbConnected()) {
        // Deactivate older promo code if code was changed
        if (oldPromoCode && oldPromoCode !== formattedCode) {
          await Coupon.findOneAndUpdate({ code: oldPromoCode }, { isActive: false });
        }
        await Coupon.findOneAndUpdate(
          { code: formattedCode },
          { $set: couponPayload },
          { upsert: true, new: true }
        );
      } else {
        if (oldPromoCode && oldPromoCode !== formattedCode) {
          const oldC = mockDb.coupons.find((c) => c.code === oldPromoCode);
          if (oldC) oldC.isActive = false;
        }
        const existingIdx = mockDb.coupons.findIndex((c) => c.code === formattedCode);
        if (existingIdx >= 0) {
          mockDb.coupons[existingIdx] = { ...mockDb.coupons[existingIdx], ...couponPayload };
        } else {
          mockDb.coupons.push({
            _id: `coupon_flash_${Date.now()}`,
            ...couponPayload,
            usedCount: 0,
            createdAt: new Date(),
          });
        }
      }
    }

    // Sync in Settings collection as well
    if (isDbConnected()) {
      try {
        await Settings.findOneAndUpdate(
          { key: 'flash_sale_settings' },
          {
            key: 'flash_sale_settings',
            value: {
              isActive: isSaleActive,
              title: flashSale.title,
              subtitle: flashSale.subtitle,
              promoCode: formattedCode,
              discountPercentage: discountVal,
              endTime: parsedEndTime,
              targetProject: parsedTargetProject,
              targetProjectTitle: parsedTargetTitle,
              badge: parsedBadge,
              festivalTheme: parsedTheme,
            },
          },
          { upsert: true }
        );
      } catch (_) {}
    }

    return res.json({
      success: true,
      message: `Festival / Flash Sale is now ${isSaleActive ? 'ACTIVE (LIVE)' : 'INACTIVE (PAUSED)'} with code "${formattedCode}" active on ${parsedTargetTitle}!`,
      flashSale,
    });
  } catch (error) {
    console.error('Error updating flash/festival sale:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete and deactivate active Festival / Flash Sale & remove its coupon (Admin only)
 * @route   DELETE /api/flash-sale
 * @access  Private/Admin
 */
export const deleteFlashSale = async (req, res) => {
  try {
    let codeToDelete = null;

    if (isDbConnected()) {
      const flashSale = await FlashSale.findOne();
      if (flashSale) {
        codeToDelete = flashSale.promoCode;
        await FlashSale.deleteMany({});
      }
      if (codeToDelete) {
        await Coupon.deleteOne({ code: codeToDelete });
      }
      try {
        await Settings.deleteMany({ key: 'flash_sale_settings' });
      } catch (_) {}
    } else {
      if (mockDb.flashSale) {
        codeToDelete = mockDb.flashSale.promoCode;
        mockDb.flashSale = null;
      }
      if (codeToDelete) {
        mockDb.coupons = mockDb.coupons.filter((c) => c.code !== codeToDelete);
      }
    }

    return res.json({
      success: true,
      message: 'Festival / Flash Sale deleted and removed from store permanently!',
    });
  } catch (error) {
    console.error('Error deleting flash sale:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getFlashSale,
  updateFlashSale,
  deleteFlashSale,
};

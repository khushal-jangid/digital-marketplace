import FlashSale from '../models/FlashSale.js';
import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';

/**
 * @desc    Get active Flash Sale settings & countdown end time
 * @route   GET /api/flash-sale
 * @access  Public
 */
export const getFlashSale = async (req, res) => {
  try {
    const flashSale = await FlashSale.findOne().sort({ createdAt: -1 });
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
        isExpired,
      },
    });
  } catch (error) {
    console.error('Error fetching flash sale:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Flash Sale configuration & sync associated coupon (Admin only)
 * @route   PUT /api/flash-sale
 * @access  Private/Admin
 */
export const updateFlashSale = async (req, res) => {
  const { isActive, title, subtitle, promoCode, discountPercentage, endTime, targetProject, targetProjectTitle } = req.body;

  try {
    const formattedCode = promoCode ? promoCode.trim().toUpperCase() : 'FLASH35';
    const discountVal = Number(discountPercentage) || 0;
    const parsedEndTime = endTime ? new Date(endTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const parsedTargetProject = targetProject && targetProject !== 'all' ? targetProject : null;
    const parsedTargetTitle = targetProjectTitle || (parsedTargetProject ? 'Selected Project' : 'All Projects');
    const isSaleActive = Boolean(isActive);

    let flashSale = await FlashSale.findOne();
    if (!flashSale) {
      flashSale = new FlashSale();
    }

    flashSale.isActive = isSaleActive;
    if (title !== undefined) flashSale.title = title;
    if (subtitle !== undefined) flashSale.subtitle = subtitle;
    flashSale.promoCode = formattedCode;
    flashSale.discountPercentage = discountVal;
    flashSale.endTime = parsedEndTime;
    flashSale.targetProject = parsedTargetProject;
    flashSale.targetProjectTitle = parsedTargetTitle;

    await flashSale.save();

    // Sync in Settings collection as well
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
          },
        },
        { upsert: true }
      );
    } catch (_) {}

    return res.json({
      success: true,
      message: `Flash Sale is now ${isSaleActive ? 'ACTIVE (LIVE)' : 'INACTIVE (PAUSED)'}!`,
      flashSale,
    });
  } catch (error) {
    console.error('Error updating flash sale:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete and deactivate active Flash Sale & remove its coupon (Admin only)
 * @route   DELETE /api/flash-sale
 * @access  Private/Admin
 */
export const deleteFlashSale = async (req, res) => {
  try {
    const flashSale = await FlashSale.findOne();
    if (flashSale) {
      const codeToDelete = flashSale.promoCode;
      await FlashSale.deleteMany({});
      if (codeToDelete) {
        await Coupon.deleteOne({ code: codeToDelete });
      }
    } else {
      await FlashSale.deleteMany({});
    }

    try {
      await Settings.deleteMany({ key: 'flash_sale_settings' });
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Flash Sale deleted and removed from store permanently!',
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

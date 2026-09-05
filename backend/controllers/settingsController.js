import Settings from '../models/Settings.js';

/**
 * Public store settings (used by Cart and Project details)
 */
export const getPublicSettings = async (req, res) => {
  try {
    const priceDoc = await Settings.findOne({ key: 'setup_assistance_price' });
    const enabledDoc = await Settings.findOne({ key: 'setup_assistance_enabled' });
    const titleDoc = await Settings.findOne({ key: 'setup_assistance_title' });
    const descDoc = await Settings.findOne({ key: 'setup_assistance_desc' });

    const setupAssistancePrice = priceDoc && !isNaN(Number(priceDoc.value)) ? Number(priceDoc.value) : 199;
    const setupAssistanceEnabled = enabledDoc ? enabledDoc.value === true || enabledDoc.value === 'true' : true;
    const setupAssistanceTitle = titleDoc?.value || '1-on-1 Remote Setup Help (AnyDesk / Google Meet)';
    const setupAssistanceDesc =
      descDoc?.value ||
      'Skip the hassle of .env config, database connections, and running commands. We will remotely set up and run the code on your laptop!';

    return res.status(200).json({
      success: true,
      settings: {
        setupAssistancePrice,
        setupAssistanceEnabled,
        setupAssistanceTitle,
        setupAssistanceDesc,
      },
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return res.status(200).json({
      success: true,
      settings: {
        setupAssistancePrice: 199,
        setupAssistanceEnabled: true,
        setupAssistanceTitle: '1-on-1 Remote Setup Help (AnyDesk / Google Meet)',
        setupAssistanceDesc:
          'Skip the hassle of .env config, database connections, and running commands. We will remotely set up and run the code on your laptop!',
      },
    });
  }
};

/**
 * Admin: Get all settings
 */
export const getAllSettings = async (req, res) => {
  try {
    const all = await Settings.find();
    const settingsMap = {};
    all.forEach((item) => {
      settingsMap[item.key] = item.value;
    });

    if (settingsMap.setup_assistance_price === undefined) {
      settingsMap.setup_assistance_price = 199;
    }
    if (settingsMap.setup_assistance_enabled === undefined) {
      settingsMap.setup_assistance_enabled = true;
    }
    if (!settingsMap.setup_assistance_title) {
      settingsMap.setup_assistance_title = '1-on-1 Remote Setup Help (AnyDesk / Google Meet)';
    }

    return res.status(200).json({
      success: true,
      settings: settingsMap,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message,
    });
  }
};

/**
 * Admin: Update settings
 */
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings payload.',
      });
    }

    for (const [key, value] of Object.entries(updates)) {
      await Settings.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Settings saved successfully!',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};

export default {
  getPublicSettings,
  getAllSettings,
  updateSettings,
};

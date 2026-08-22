import { sendTelegramMessage } from '../config/telegram.js';

export const submitProjectRequest = async (req, res) => {
  const { title, category, techStack, budget, description, email, phone } = req.body;

  try {
    if (!title || !description || !email) {
      return res.status(400).json({ success: false, message: 'Title, description, and contact email are required.' });
    }

    const message = `🚀 <b>NEW CUSTOM PROJECT REQUEST</b>\n\n` +
      `📌 <b>Project:</b> ${title}\n` +
      `🏷️ <b>Category:</b> ${category || 'General'}\n` +
      `💻 <b>Tech Stack:</b> ${techStack || 'Not Specified'}\n` +
      `💰 <b>Proposed Budget:</b> INR ${budget || 0}\n` +
      `👤 <b>Client Email:</b> ${email}\n` +
      `📞 <b>Client Phone:</b> ${phone || 'N/A'}\n\n` +
      `📝 <b>Project Scope:</b>\n${description}`;

    // Send instant Telegram alert to admin
    sendTelegramMessage(message).catch((err) => {
      console.error('Failed to dispatch project request to Telegram:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Your project request has been submitted to Khushal Jangid! You will be contacted shortly.',
    });
  } catch (error) {
    console.error('Error submitting project request:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

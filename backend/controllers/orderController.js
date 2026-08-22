import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import DownloadLog from '../models/DownloadLog.js';
import AbandonedLead from '../models/AbandonedLead.js';
import { generateSignedDownloadUrl } from '../config/storage.js';
import { sendPurchaseEmail, sendRejectionEmail, sendRecoveryEmail } from '../config/mail.js';
import { sendTelegramMessage, answerCallbackQuery, editTelegramMessage } from '../config/telegram.js';
import { signJwt, verifyJwt } from '../config/jwt.js';
import couponService from '../services/couponService.js';

/**
 * Check whether a user already owns any of the projects
 */
const checkAlreadyOwnedProjects = async (userId, projectIds) => {
  if (!userId || !projectIds || projectIds.length === 0) return null;

  try {
    const existingPaidOrder = await Order.findOne({
      user: userId,
      paymentStatus: { $in: ['paid', 'fulfilled', 'completed'] },
      'items.project': { $in: projectIds },
    }).populate('items.project', 'title');

    if (existingPaidOrder) {
      const ownedItem = existingPaidOrder.items.find((i) =>
        projectIds.includes(i.project?._id?.toString() || i.project?.toString())
      );
      return ownedItem?.project?.title || ownedItem?.titleAtPurchase || 'a selected product';
    }
  } catch (_) {}

  return null;
};

/**
 * Credit affiliate commission safely without self-referral
 */
const creditAffiliateIfReferred = async (order) => {
  try {
    if (!order || !order.referredByCode || order.affiliateCredited) return;

    const commission = Math.round(order.totalAmount * 0.20);
    if (commission <= 0) return;

    const buyer = await User.findById(order.user);
    if (buyer && buyer.referralCode === order.referredByCode) {
      return;
    }

    const referrer = await User.findOne({ referralCode: order.referredByCode });
    if (referrer && referrer._id.toString() !== order.user?.toString()) {
      referrer.referralEarnings = (referrer.referralEarnings || 0) + commission;
      referrer.affiliateBalance = (referrer.affiliateBalance || 0) + commission;
      await referrer.save();
      order.affiliateCredited = true;
      await Order.findByIdAndUpdate(order._id, { affiliateCredited: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Affiliate] Commission credit notice:', err.message);
  }
};

/**
 * @desc    Submit QR Code UTR Manual Payment
 * @route   POST /api/orders/qr-checkout
 * @access  Public / User
 */
export const createQrOrder = async (req, res) => {
  try {
    const {
      projectIds,
      items,
      couponCode,
      transactionRef,
      contactEmail,
      contactPhone,
      referredByCode,
    } = req.body;

    const cleanUtr = (transactionRef || '').trim();
    const cleanEmail = (contactEmail || '').trim().toLowerCase();
    const cleanPhone = (contactPhone || '').trim();

    if (!cleanUtr || cleanUtr.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_UTR',
        message: 'Please enter a valid 12-digit numeric UPI UTR Transaction Reference Number.',
      });
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EMAIL',
        message: 'Please enter a valid email address.',
      });
    }

    // 1. Resolve or Create User
    let userId = req.user?._id;
    let authUser = req.user;
    let autoToken = null;

    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyJwt(token);
        if (decoded && decoded.id) {
          authUser = await User.findById(decoded.id);
          if (authUser) userId = authUser._id;
        }
      } catch (_) {}
    }

    if (!userId) {
      let existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        userId = existingUser._id;
        authUser = existingUser;
        autoToken = signJwt({ id: existingUser._id }, { expiresIn: '30d' });
      } else {
        const generatedPassword = Math.random().toString(36).substring(2, 10) + 'A1!';
        const newUser = await User.create({
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          password: generatedPassword,
          role: 'user',
          referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        });
        userId = newUser._id;
        authUser = newUser;
        autoToken = signJwt({ id: newUser._id }, { expiresIn: '30d' });
      }
    }

    // 2. Resolve Target Projects
    const targetIds = Array.isArray(projectIds) && projectIds.length > 0
      ? projectIds
      : Array.isArray(items) ? items.map((i) => (i.project?._id || i.project || i._id || i.id)).filter(Boolean) : [];

    const uniqueIds = [...new Set(targetIds.map((id) => (id ? id.toString() : '')))].filter(Boolean);

    if (uniqueIds.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'EMPTY_CART',
        message: 'Your shopping cart is empty.',
      });
    }

    // Check already owned
    const alreadyOwnedTitle = await checkAlreadyOwnedProjects(userId, uniqueIds);
    if (alreadyOwnedTitle) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_OWNED',
        message: `You already own "${alreadyOwnedTitle}". You can download it directly from your dashboard.`,
      });
    }

    // Fetch projects from MongoDB
    const validObjectIds = uniqueIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const projects = await Project.find({
      $or: [
        { _id: { $in: validObjectIds } },
        { id: { $in: uniqueIds } },
      ],
    });

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'PROJECTS_NOT_FOUND',
        message: 'The selected products could not be found in catalog.',
      });
    }

    // 3. Build Order Items
    const orderItems = projects.map((p) => ({
      project: p._id,
      titleAtPurchase: p.title,
      priceAtPurchase: Number(p.price) || 0,
    }));

    const subtotal = orderItems.reduce((acc, curr) => acc + curr.priceAtPurchase, 0);
    let discountAmount = 0;
    let totalAmount = subtotal;
    let validCouponCode = null;

    if (couponCode) {
      const couponValidation = await couponService.validateCoupon({
        code: couponCode,
        cartItems: projects,
        subtotal,
      });

      if (couponValidation.valid) {
        discountAmount = couponValidation.discount;
        totalAmount = couponValidation.finalTotal;
        validCouponCode = couponValidation.coupon.code;
      }
    }

    // 4. Create Order in MongoDB
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      discountAmount,
      couponApplied: validCouponCode,
      paymentStatus: 'pending_verification',
      paymentMethod: 'qr_code',
      transactionRef: cleanUtr,
      contactEmail: cleanEmail,
      contactPhone: cleanPhone,
      referredByCode: referredByCode ? referredByCode.trim().toUpperCase() : null,
    });

    console.log(`[Order Submitted] ID: ${order._id}, Total: ₹${totalAmount}, UTR: ${cleanUtr}, Email: ${cleanEmail}`);

    // 5. Send Telegram notification to Admin
    const projectTitles = projects.map((p) => p.title).join(', ');
    const tgText = `🛒 <b>NEW ORDER PAYMENT (UTR) RECEIVED!</b>\\n\\n` +
      `👤 <b>Customer:</b> ${cleanEmail} (📞 ${cleanPhone || 'N/A'})\\n` +
      `📦 <b>Project(s):</b> ${projectTitles}\\n` +
      `💰 <b>Amount:</b> INR ${totalAmount}\\n` +
      `💳 <b>UTR Reference:</b> <code>${cleanUtr}</code>\\n\\n` +
      `⚡ Click <b>Approve</b> below to immediately unlock download access for this customer:`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '✅ Approve & Unlock Download', callback_data: `approve_${order._id}` },
          { text: '❌ Reject Order', callback_data: `reject_${order._id}` }
        ],
        ...(cleanPhone ? [[{ text: '💬 WhatsApp Customer', url: `https://wa.me/91${cleanPhone.replace(/\\D/g, '')}?text=Hi,%20I%20received%20your%20payment%20for%20${encodeURIComponent(projectTitles)}.` }]] : [])
      ]
    };

    sendTelegramMessage(tgText, replyMarkup).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'UTR Submitted Successfully! Once verified by Admin, your download access will be unlocked.',
      orderId: order._id,
      token: autoToken,
      user: authUser ? {
        _id: authUser._id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
      } : null,
      order,
    });
  } catch (error) {
    console.error('QR Checkout Error:', error);
    return res.status(500).json({
      success: false,
      code: 'QR_CHECKOUT_ERROR',
      message: error.message || 'Payment submission failed',
    });
  }
};

/**
 * @desc    Approve manual QR code payment UTR (Admin only)
 * @route   POST /api/orders/verify-utr/:id
 * @access  Private/Admin
 */
export const verifyUtrOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const hostUrl = `${req.protocol}://${req.get('host')}`;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, code: 'INVALID_ID', message: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId).populate('items.project').populate('user');
    if (!order) return res.status(404).json({ success: false, code: 'ORDER_NOT_FOUND', message: 'Order not found' });

    if (order.paymentStatus === 'paid' || order.paymentStatus === 'fulfilled') {
      return res.json({ success: true, message: 'Order is already approved', order });
    }

    order.paymentStatus = 'paid';
    await order.save();

    if (order.couponApplied) {
      await couponService.redeemCoupon(order.couponApplied).catch(() => {});
    }
    await creditAffiliateIfReferred(order);

    const downloadLinks = [];
    const userIdStr = order.user && order.user._id ? order.user._id.toString() : 'guest_user';

    for (const item of order.items) {
      if (!item.project) continue;
      const proj = item.project;
      const directUrl = proj.externalDownloadUrl || proj.fileUrl || item.externalDownloadUrl || item.fileUrl || 'https://codewithkj.vercel.app/dashboard';

      downloadLinks.push({
        title: proj.title || item.titleAtPurchase || 'Download Link',
        downloadUrl: directUrl,
      });
    }

    const customerEmail = order.contactEmail || order.user?.email;
    const customerName = order.user?.name || customerEmail?.split('@')[0] || 'Valued Developer';

    if (customerEmail) {
      sendPurchaseEmail(customerEmail, customerName, order, downloadLinks).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'Order verified and download links unlocked successfully.',
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'VERIFICATION_ERROR', message: error.message });
  }
};

export const rejectUtrOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;

    const order = await Order.findById(orderId).populate('user');
    if (!order) return res.status(404).json({ success: false, code: 'ORDER_NOT_FOUND', message: 'Order not found' });

    order.paymentStatus = 'failed';
    await order.save();

    const customerEmail = order.contactEmail || order.user?.email;
    const customerName = order.user?.name || 'Customer';

    if (customerEmail) {
      sendRejectionEmail(customerEmail, customerName, order, reason || 'UTR verification unsuccessful').catch(() => {});
    }

    return res.json({ success: true, message: 'Order marked as rejected.', order });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'REJECT_ERROR', message: error.message });
  }
};

export const getMyPurchasedProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const hostUrl = `${req.protocol}://${req.get('host')}`;

    const paidOrders = await Order.find({
      user: userId,
      paymentStatus: { $in: ['paid', 'fulfilled', 'completed'] },
    })
      .populate('items.project')
      .sort({ createdAt: -1 });

    const allUserOrders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    const purchasesMap = new Map();

    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!item.project) return;
        const pId = item.project._id.toString();

        if (!purchasesMap.has(pId)) {
          const downloadUrl = generateSignedDownloadUrl(
            item.project.fileKey || '',
            item.project.fileName || `${item.project.title || 'source-code'}.zip`,
            userId.toString(),
            pId,
            order._id.toString(),
            hostUrl
          );

          purchasesMap.set(pId, {
            project: item.project,
            orderId: order._id,
            purchaseDate: order.createdAt,
            licenseType: item.licenseType || 'personal',
            downloadUrl: item.project.fileUrl || item.project.externalDownloadUrl || downloadUrl,
            invoiceNumber: order.invoiceNumber || `INV-${order._id.toString().slice(-6).toUpperCase()}`,
          });
        }
      });
    });

    const purchases = Array.from(purchasesMap.values());

    return res.json({
      success: true,
      count: purchases.length,
      purchases,
      orders: allUserOrders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'PURCHASES_ERROR', message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.project', 'title category price fileUrl externalDownloadUrl')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'ORDERS_FETCH_ERROR', message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.project').populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const refundOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: 'refunded' }, { new: true });
    return res.json({ success: true, message: 'Order refunded', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDownloadHistory = async (req, res) => {
  try {
    const logs = await DownloadLog.find({ user: req.user._id }).populate('project').sort({ downloadedAt: -1 });
    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const saveAbandonedLead = async (req, res) => {
  try {
    const { email, phone, items, totalAmount } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let lead = await AbandonedLead.findOne({ email: cleanEmail });
    if (lead) {
      lead.phone = phone || lead.phone;
      lead.items = items || lead.items;
      lead.totalAmount = totalAmount || lead.totalAmount;
      await lead.save();
    } else {
      lead = await AbandonedLead.create({
        email: cleanEmail,
        phone: phone || '',
        items: items || [],
        totalAmount: Number(totalAmount) || 0,
      });
    }

    return res.status(201).json({ success: true, lead });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Order permanently deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendRecoveryEmails = async (req, res) => {
  try {
    const leads = await AbandonedLead.find({ recoveryEmailSent: false }).limit(20);
    for (const lead of leads) {
      await sendRecoveryEmail(lead.email, lead.items, 'RECOVER15').catch(() => {});
      lead.recoveryEmailSent = true;
      lead.recoveryEmailSentAt = new Date();
      await lead.save();
    }
    return res.json({ success: true, message: `Dispatched recovery emails to ${leads.length} leads` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const telegramWebhook = async (req, res) => {
  try {
    const { callback_query } = req.body;
    if (!callback_query) return res.sendStatus(200);

    const { id: callbackQueryId, data, message } = callback_query;
    const messageId = message?.message_id;
    const chatId = message?.chat?.id;

    if (data.startsWith('approve_')) {
      const orderId = data.split('_')[1];
      const order = await Order.findById(orderId).populate('items.project').populate('user');
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        await order.save();
        await answerCallbackQuery(callbackQueryId, '✅ Order Approved & Download Unlocked!');
        await editTelegramMessage(chatId, messageId, `✅ <b>ORDER APPROVED</b> (ID: ${orderId})`);
      }
    } else if (data.startsWith('reject_')) {
      const orderId = data.split('_')[1];
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'failed';
        await order.save();
        await answerCallbackQuery(callbackQueryId, '❌ Order Rejected');
        await editTelegramMessage(chatId, messageId, `❌ <b>ORDER REJECTED</b> (ID: ${orderId})`);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(200);
  }
};

export const handleTelegramCallback = async (callbackQuery) => {
  if (!callbackQuery || !callbackQuery.data) return;
  const { id: callbackQueryId, data, message } = callbackQuery;
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;

  try {
    if (data.startsWith('approve_')) {
      const orderId = data.replace('approve_', '');
      const order = await Order.findById(orderId).populate('items.project').populate('user');
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        await order.save();
        await answerCallbackQuery(callbackQueryId, '✅ Order Approved & Download Unlocked!');
        if (chatId && messageId) {
          await editTelegramMessage(chatId, messageId, `✅ <b>ORDER APPROVED & DOWNLOAD UNLOCKED</b> (ID: ${orderId})`).catch(() => {});
        }
      }
    } else if (data.startsWith('reject_')) {
      const orderId = data.replace('reject_', '');
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'failed';
        await order.save();
        await answerCallbackQuery(callbackQueryId, '❌ Order Rejected');
        if (chatId && messageId) {
          await editTelegramMessage(chatId, messageId, `❌ <b>ORDER REJECTED</b> (ID: ${orderId})`).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('Telegram callback handling error:', err.message);
  }
};

export const checkout = createQrOrder;
export const verifyPayment = verifyUtrOrder;
export const getMyPurchases = getMyPurchasedProjects;
export const rejectOrder = rejectUtrOrder;
export const saveAbandonedCartLead = saveAbandonedLead;

export default {
  checkout,
  verifyPayment,
  createQrOrder,
  verifyUtrOrder,
  rejectUtrOrder,
  getMyPurchasedProjects,
  getMyPurchases,
  getAllOrders,
  getOrderById,
  deleteOrder,
  refundOrder,
  getDownloadHistory,
  saveAbandonedLead,
  saveAbandonedCartLead,
  sendRecoveryEmails,
  telegramWebhook,
  handleTelegramCallback,
};

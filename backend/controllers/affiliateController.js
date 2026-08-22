import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { sendTelegramMessage } from '../config/telegram.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';

/**
 * @desc    Get current user's affiliate statistics and history
 * @route   GET /api/affiliates/stats
 * @access  Private
 */
export const getAffiliateStats = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!isDbConnected()) {
      const user = mockDb.users.find((u) => u._id === userId) || req.user;
      if (!user.referralCode) {
        user.referralCode = `APEX-${userId.toString().slice(-4).toUpperCase()}`;
      }

      const referredOrders = mockDb.orders.filter(
        (o) => o.referredByCode === user.referralCode && o.paymentStatus === 'paid'
      );

      const totalSales = referredOrders.length;
      const totalEarned = user.referralEarnings || totalSales * 60;
      const availableBalance = user.affiliateBalance !== undefined ? user.affiliateBalance : totalEarned;

      return res.json({
        success: true,
        stats: {
          referralCode: user.referralCode,
          commissionRate: 20,
          totalSales,
          totalEarned,
          availableBalance,
          payouts: user.affiliatePayouts || [],
          recentOrders: referredOrders.map((o) => ({
            _id: o._id,
            amount: o.totalAmount,
            commission: Math.round(o.totalAmount * 0.20),
            date: o.createdAt,
          })),
        },
      });
    }

    const user = await User.findById(userId);
    if (!user.referralCode) {
      user.referralCode = `APEX-${user._id.toString().slice(-4).toUpperCase()}`;
      await user.save();
    }

    const referredOrders = await Order.find({
      referredByCode: user.referralCode,
      paymentStatus: 'paid',
    }).sort({ createdAt: -1 });

    const totalSales = referredOrders.length;
    const totalEarned = user.referralEarnings || 0;
    const availableBalance = user.affiliateBalance !== undefined ? user.affiliateBalance : totalEarned;

    res.json({
      success: true,
      stats: {
        referralCode: user.referralCode,
        commissionRate: 20,
        totalSales,
        totalEarned,
        availableBalance,
        payouts: user.affiliatePayouts || [],
        recentOrders: referredOrders.map((o) => ({
          _id: o._id,
          amount: o.totalAmount,
          commission: Math.round(o.totalAmount * 0.20),
          date: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error.message);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Request UPI Payout for earned affiliate commission
 * @route   POST /api/affiliates/payout-request
 * @access  Private
 */
export const requestAffiliatePayout = async (req, res) => {
  const { upiId, amount } = req.body;

  try {
    if (!upiId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, code: 'INVALID_AMOUNT', message: 'Please provide a valid UPI ID and payout amount.' });
    }

    const requestedAmount = Math.round(Number(amount));
    const userId = req.user._id;

    if (!isDbConnected()) {
      const user = mockDb.users.find((u) => u._id === userId) || req.user;
      user.affiliateBalance = Math.max(0, (user.affiliateBalance || 0) - requestedAmount);
      if (!user.affiliatePayouts) user.affiliatePayouts = [];

      const payout = {
        _id: `payout_${Date.now()}`,
        amount: requestedAmount,
        upiId: upiId.trim(),
        status: 'pending',
        requestedAt: new Date(),
      };
      user.affiliatePayouts.push(payout);

      return res.status(201).json({
        success: true,
        message: `Payout request of INR ${requestedAmount} submitted!`,
        payout,
      });
    }

    const user = await User.findById(userId);
    const currentBalance = user.affiliateBalance !== undefined ? user.affiliateBalance : (user.referralEarnings || 0);

    if (requestedAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        message: `Insufficient affiliate balance. Available: INR ${currentBalance}`,
      });
    }

    user.affiliateBalance = currentBalance - requestedAmount;
    if (!user.affiliatePayouts) user.affiliatePayouts = [];

    const payout = {
      amount: requestedAmount,
      upiId: upiId.trim(),
      status: 'pending',
      requestedAt: new Date(),
    };
    user.affiliatePayouts.push(payout);
    await user.save();

    const tgMsg = `💸 <b>NEW AFFILIATE PAYOUT REQUEST</b>\n\n` +
      `👤 <b>Promoter:</b> ${user.name} (${user.email})\n` +
      `💰 <b>Amount:</b> INR ${requestedAmount}\n` +
      `💳 <b>Payee UPI ID:</b> <code>${upiId}</code>\n\n` +
      `Please transfer INR ${requestedAmount} to the UPI ID above.`;
    sendTelegramMessage(tgMsg).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Payout request of INR ${requestedAmount} submitted!`,
      payout,
    });
  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Get all affiliate payouts (Admin only)
 * @route   GET /api/affiliates/payouts
 * @access  Private/Admin
 */
export const getAllAffiliatePayouts = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ success: true, payouts: [] });
    }

    const usersWithPayouts = await User.find({ 'affiliatePayouts.0': { $exists: true } }).select(
      'name email referralCode affiliatePayouts'
    );

    const allPayouts = [];
    for (const u of usersWithPayouts) {
      for (const p of u.affiliatePayouts || []) {
        allPayouts.push({
          payoutId: p._id,
          userId: u._id,
          userName: u.name,
          userEmail: u.email,
          referralCode: u.referralCode,
          amount: p.amount,
          upiId: p.upiId,
          status: p.status,
          requestedAt: p.requestedAt,
          paidAt: p.paidAt,
        });
      }
    }

    allPayouts.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    return res.json({ success: true, count: allPayouts.length, payouts: allPayouts });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

export default {
  getAffiliateStats,
  requestAffiliatePayout,
  getAllAffiliatePayouts,
};

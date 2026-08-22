import AbandonedCart from '../models/AbandonedCart.js';
import Coupon from '../models/Coupon.js';
import { sendRecoveryEmail } from '../config/mail.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';

let inMemoryAbandonedCarts = [];

/**
 * @desc    Sync active user cart for abandoned cart tracking
 * @route   POST /api/cart-recovery/sync
 * @access  Public
 */
export const syncCart = async (req, res) => {
  try {
    const { email, name, items, cartTotal, status } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const formattedName = name || 'Developer';
    const parsedItems = Array.isArray(items) ? items : [];
    const total = Number(cartTotal) || 0;

    if (!isDbConnected()) {
      let cart = inMemoryAbandonedCarts.find((c) => c.email === cleanEmail);
      if (parsedItems.length === 0 || status === 'recovered') {
        if (cart) {
          cart.status = status || 'recovered';
        }
        return res.json({ success: true, message: 'Cart updated' });
      }

      if (!cart) {
        cart = {
          _id: `ab_cart_${Date.now()}`,
          email: cleanEmail,
          name: formattedName,
          items: parsedItems,
          cartTotal: total,
          recoveryEmailSent: false,
          recoveryEmailSentAt: null,
          status: 'abandoned',
          lastActivity: new Date(),
          createdAt: new Date(),
        };
        inMemoryAbandonedCarts.unshift(cart);
      } else {
        cart.items = parsedItems;
        cart.cartTotal = total;
        cart.name = formattedName;
        cart.status = 'abandoned';
        cart.lastActivity = new Date();
      }

      return res.json({ success: true, message: 'Cart synced successfully', cart });
    }

    if (parsedItems.length === 0 || status === 'recovered') {
      await AbandonedCart.findOneAndUpdate(
        { email: cleanEmail, status: 'abandoned' },
        { status: status || 'recovered', lastActivity: new Date() }
      );
      return res.json({ success: true, message: 'Cart marked completed' });
    }

    const cart = await AbandonedCart.findOneAndUpdate(
      { email: cleanEmail, status: 'abandoned' },
      {
        email: cleanEmail,
        name: formattedName,
        items: parsedItems,
        cartTotal: total,
        status: 'abandoned',
        lastActivity: new Date(),
        user: req.user ? req.user._id : null,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Cart synced successfully', cart });
  } catch (error) {
    console.error('Cart sync error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all abandoned carts (Admin only)
 * @route   GET /api/cart-recovery
 * @access  Private/Admin
 */
export const getAbandonedCarts = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({
        success: true,
        count: inMemoryAbandonedCarts.length,
        carts: inMemoryAbandonedCarts,
      });
    }

    const carts = await AbandonedCart.find({ status: 'abandoned' })
      .sort({ lastActivity: -1 })
      .populate('user', 'name email');

    res.json({
      success: true,
      count: carts.length,
      carts,
    });
  } catch (error) {
    console.error('Get abandoned carts error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Send recovery reminder email to a customer with 10% coupon code
 * @route   POST /api/cart-recovery/:id/send-reminder
 * @access  Private/Admin
 */
export const sendCartReminder = async (req, res) => {
  try {
    const { id } = req.params;
    let cart = null;

    if (!isDbConnected()) {
      cart = inMemoryAbandonedCarts.find((c) => c._id === id);
    } else {
      cart = await AbandonedCart.findById(id);
    }

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Abandoned cart record not found' });
    }

    // Ensure coupon CART10 exists
    if (!isDbConnected()) {
      let coupon = mockDb.coupons.find((c) => c.code === 'CART10');
      if (!coupon) {
        mockDb.coupons.push({
          _id: `coup_cart10`,
          code: 'CART10',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 0,
          expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          usedCount: 0,
          isActive: true,
        });
      }
    } else {
      await Coupon.findOneAndUpdate(
        { code: 'CART10' },
        {
          code: 'CART10',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 0,
          expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }

    const itemsHtml = cart.items
      .map(
        (item) => `
        <div style="padding: 12px; margin-bottom: 8px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <div>
            <strong style="color: #0f172a; font-size: 14px;">${item.title}</strong>
            <div style="color: #64748b; font-size: 12px;">License: ${item.licenseType || 'Personal'}</div>
          </div>
          <div style="font-weight: bold; color: #4f46e5; font-size: 15px;">₹${item.price}</div>
        </div>
      `
      )
      .join('');

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">🛒 You left items in your cart!</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Complete your purchase today & get an extra 10% discount.</p>
        </div>

        <div style="padding: 24px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">
            Hi <strong>${cart.name || 'Developer'}</strong>,
          </p>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">
            We noticed you didn't finish downloading your selected developer templates on <strong>ApexMarket</strong>. Here are the items reserved for you:
          </p>

          <div style="margin: 20px 0;">
            ${itemsHtml}
          </div>

          <div style="background: #fdf4ff; border: 1px dashed #c084fc; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 12px; color: #7e22ce; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 4px;">
              🎁 Exclusive 10% Recovery Coupon
            </span>
            <div style="font-size: 22px; font-weight: 900; color: #6b21a8; font-family: monospace; letter-spacing: 2px;">
              CART10
            </div>
            <span style="font-size: 11px; color: #9333ea;">Apply code at checkout for instant extra 10% OFF</span>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5174/cart?coupon=CART10" style="background: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
              Complete Order & Download Now ➔
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin: 0;">Need any help or custom modifications? Reply to this email or contact support.</p>
            <p style="margin: 4px 0 0 0;">© 2026 ApexMarket • Curated by Khushal Jangid</p>
          </div>
        </div>
      </div>
    `;

    await sendRecoveryEmail(cart.email, html);

    cart.recoveryEmailSent = true;
    cart.recoveryEmailSentAt = new Date();
    if (isDbConnected()) {
      await cart.save();
    }

    res.json({
      success: true,
      message: `Abandoned cart recovery reminder sent to ${cart.email} with 10% discount code CART10!`,
    });
  } catch (error) {
    console.error('Send cart reminder error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete an abandoned cart record (Admin only)
 * @route   DELETE /api/cart-recovery/:id
 * @access  Private/Admin
 */
export const deleteAbandonedCart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      inMemoryAbandonedCarts = inMemoryAbandonedCarts.filter((c) => c._id !== id);
      return res.json({ success: true, message: 'Cart record deleted' });
    }

    await AbandonedCart.findByIdAndDelete(id);
    res.json({ success: true, message: 'Cart record deleted' });
  } catch (error) {
    console.error('Delete cart error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

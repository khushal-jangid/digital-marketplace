import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpay = null;

export const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret && !razorpay) {
    try {
      razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      console.log('Razorpay SDK Initialized Successfully');
    } catch (error) {
      console.error('Failed to initialize Razorpay SDK:', error.message);
    }
  }
  return razorpay;
};

/**
 * Create a Razorpay Order
 * @param {number} amount - Amount in INR
 * @param {string} receiptId - Unique receipt identifier
 * @returns {Promise<Object>} Razorpay order details or mock order
 */
export const createRazorpayOrder = async (amount, receiptId) => {
  const amountInPaise = Math.round(amount * 100);
  const rz = getRazorpayInstance();

  if (rz) {
    return await rz.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
    });
  }

  // Development sandbox fallback if keys are missing
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Razorpay credentials are not configured in production.');
  }

  const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 12)}`;
  return {
    id: mockOrderId,
    entity: 'order',
    amount: amountInPaise,
    amount_paid: 0,
    amount_due: amountInPaise,
    currency: 'INR',
    receipt: receiptId,
    status: 'created',
    created_at: Math.floor(Date.now() / 1000),
    isMock: true,
  };
};

/**
 * Verify Razorpay Signature using HMAC SHA256
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature to verify
 * @param {string} [customSecret] - Optional explicit secret override
 * @returns {boolean} Whether signature is valid
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature, customSecret = null) => {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const secret = customSecret || process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    // Non-production sandbox verification
    if (process.env.NODE_ENV !== 'production' && orderId.startsWith('order_mock_')) {
      return signature === `mock_sig_${orderId}`;
    }
    return false;
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Constant-time buffer comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, 'hex');
    const genBuffer = Buffer.from(generatedSignature, 'hex');

    if (sigBuffer.length !== genBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, genBuffer);
  } catch (err) {
    return false;
  }
};

/**
 * Verify Razorpay Webhook Signature
 * @param {string} rawBody - Raw request body string
 * @param {string} signature - Signature from headers (x-razorpay-signature)
 * @param {string} webhookSecret - Configured webhook secret
 * @returns {boolean} Whether signature is valid
 */
export const verifyWebhookSignature = (rawBody, signature, webhookSecret) => {
  if (!rawBody || !signature || !webhookSecret) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch (err) {
    return false;
  }
};

export default getRazorpayInstance;

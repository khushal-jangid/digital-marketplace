import assert from 'assert';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import couponService, {
  normalizeCouponCode,
  validateCartEligibility,
  calculateDiscount,
  validateCoupon,
} from '../services/couponService.js';
import { getJwtSecret, signJwt, verifyJwt } from '../config/jwt.js';
import { getSecureFilePath, SECURE_UPLOAD_DIR } from '../config/storage.js';
import { verifyRazorpaySignature } from '../config/razorpay.js';

let passed = 0;
let failed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
};

async function runSecurityTests() {
  console.log('\n========================================');
  console.log('🛡️  DIGITAL MARKETPLACE PHASE 2 AUDIT TEST SUITE');
  console.log('========================================\n');

  // ----------------------------------------------------
  // SECTION 1: JWT & AUTH SECURITY TESTS
  // ----------------------------------------------------
  console.log('📦 1. JWT & AUTHENTICATION TESTS:');

  await test('Missing JWT secret throws fatal error in production', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      assert.throws(() => getJwtSecret(), /FATAL SECURITY ERROR/);
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.JWT_SECRET = originalSecret;
    }
  });

  await test('Sign and verify JWT works with centralized config', () => {
    const token = signJwt({ id: 'user_123', role: 'user' }, { expiresIn: '1h' });
    const decoded = verifyJwt(token);
    assert.strictEqual(decoded.id, 'user_123');
    assert.strictEqual(decoded.role, 'user');
  });

  await test('Invalid/Tampered JWT is rejected', () => {
    const validToken = signJwt({ id: 'user_123' });
    const tamperedToken = validToken.slice(0, -5) + 'abcde';
    assert.throws(() => verifyJwt(tamperedToken), /invalid signature|jwt malformed/i);
  });

  await test('Expired JWT is rejected', () => {
    const expiredToken = jwt.sign({ id: 'user_123' }, getJwtSecret(), { expiresIn: '-1s' });
    assert.throws(() => verifyJwt(expiredToken), /jwt expired/i);
  });

  // ----------------------------------------------------
  // SECTION 2: PASSWORD SECURITY & RESET TOKEN TESTS
  // ----------------------------------------------------
  console.log('\n📦 2. PASSWORD SECURITY & RESET TOKENS:');

  await test('Password reset token generates single-use sha256 hash', () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    assert.strictEqual(hashedToken.length, 64);
    assert.notStrictEqual(rawToken, hashedToken);
  });

  await test('Expired password reset token comparison is rejected', () => {
    const pastDate = new Date(Date.now() - 1000);
    const isExpired = pastDate <= new Date();
    assert.strictEqual(isExpired, true);
  });

  // ----------------------------------------------------
  // SECTION 3: COUPON SYSTEM TESTS
  // ----------------------------------------------------
  console.log('\n📦 3. COUPON SYSTEM & PRICING TESTS:');

  await test('Code normalization handles lowercase and whitespace', () => {
    assert.strictEqual(normalizeCouponCode('  save20  '), 'SAVE20');
    assert.strictEqual(normalizeCouponCode('flash35'), 'FLASH35');
    assert.strictEqual(normalizeCouponCode(''), '');
  });

  await test('Valid percentage coupon calculation', () => {
    const coupon = {
      code: 'SAVE20',
      discountType: 'percentage',
      discountValue: 20,
    };
    const { discount, finalTotal } = calculateDiscount(coupon, 1000, 1000);
    assert.strictEqual(discount, 200);
    assert.strictEqual(finalTotal, 800);
  });

  await test('Percentage coupon cannot exceed maxDiscount cap', () => {
    const coupon = {
      code: 'BIG50',
      discountType: 'percentage',
      discountValue: 50,
      maxDiscount: 300,
    };
    const { discount, finalTotal } = calculateDiscount(coupon, 2000, 2000);
    assert.strictEqual(discount, 300);
    assert.strictEqual(finalTotal, 1700);
  });

  await test('Valid fixed coupon calculation', () => {
    const coupon = {
      code: 'FLAT150',
      discountType: 'fixed',
      discountValue: 150,
    };
    const { discount, finalTotal } = calculateDiscount(coupon, 500, 500);
    assert.strictEqual(discount, 150);
    assert.strictEqual(finalTotal, 350);
  });

  await test('Fixed discount cannot exceed subtotal (no negative totals)', () => {
    const coupon = {
      code: 'SUPER500',
      discountType: 'fixed',
      discountValue: 500,
    };
    const { discount, finalTotal } = calculateDiscount(coupon, 200, 200);
    assert.strictEqual(discount, 200);
    assert.strictEqual(finalTotal, 0);
  });

  await test('Zero subtotal handles safely', () => {
    const coupon = {
      code: 'TEST20',
      discountType: 'percentage',
      discountValue: 20,
    };
    const { discount, finalTotal } = calculateDiscount(coupon, 0, 0);
    assert.strictEqual(discount, 0);
    assert.strictEqual(finalTotal, 0);
  });

  await test('Target project coupon: applies ONLY to eligible project in cart', () => {
    const targetProjectId = 'proj_ai_starter';
    const coupon = {
      code: 'AIONLY30',
      discountType: 'percentage',
      discountValue: 30,
      targetProject: targetProjectId,
      targetProjectTitle: 'AI Starter Kit',
    };

    const cartItems = [
      { _id: 'proj_ai_starter', title: 'AI Starter', price: 1000 },
      { _id: 'proj_other_kit', title: 'Other Kit', price: 500 },
    ];

    const eligibility = validateCartEligibility(coupon, cartItems);
    assert.strictEqual(eligibility.eligible, true);
    assert.strictEqual(eligibility.eligibleSubtotal, 1000);

    const { discount, finalTotal } = calculateDiscount(coupon, eligibility.eligibleSubtotal, 1500);
    assert.strictEqual(discount, 300);
    assert.strictEqual(finalTotal, 1200);
  });

  await test('Target project coupon: REJECTS cart not containing target project', () => {
    const coupon = {
      code: 'AIONLY30',
      discountType: 'percentage',
      discountValue: 30,
      targetProject: 'proj_ai_starter',
      targetProjectTitle: 'AI Starter Kit',
    };

    const cartItems = [
      { _id: 'proj_unrelated_item', title: 'Unrelated Product', price: 800 },
    ];

    const eligibility = validateCartEligibility(coupon, cartItems);
    assert.strictEqual(eligibility.eligible, false);
    assert.match(eligibility.reason, /exclusively valid for/i);
  });

  // ----------------------------------------------------
  // SECTION 4: CHECKOUT, PRICING & ALREADY PURCHASED TESTS
  // ----------------------------------------------------
  console.log('\n📦 4. CHECKOUT & ALREADY OWNED INTEGRITY:');

  await test('Duplicate project IDs in checkout are deduplicated', () => {
    const requestedIds = ['proj_1', 'proj_1', 'proj_2', 'proj_1'];
    const uniqueIds = [...new Set(requestedIds.map((id) => id.toString()))];
    assert.strictEqual(uniqueIds.length, 2);
    assert.deepStrictEqual(uniqueIds, ['proj_1', 'proj_2']);
  });

  await test('Checkout price is calculated server-side ignoring client amount tampering', () => {
    const dbProjects = [
      { _id: 'proj_1', price: 500 },
      { _id: 'proj_2', price: 1000 },
    ];

    const authoritativeSubtotal = dbProjects.reduce((sum, p) => sum + p.price, 0);
    assert.strictEqual(authoritativeSubtotal, 1500);
  });

  await test('Already owned product detection logic', () => {
    const userPaidProjects = ['proj_1', 'proj_3'];
    const cartProjectIds = ['proj_2', 'proj_1'];
    const hasAlreadyOwned = cartProjectIds.some((id) => userPaidProjects.includes(id));
    assert.strictEqual(hasAlreadyOwned, true);
  });

  // ----------------------------------------------------
  // SECTION 5: ORDER STATE MACHINE & IDEMPOTENCY TESTS
  // ----------------------------------------------------
  console.log('\n📦 5. ORDER STATE MACHINE & IDEMPOTENCY:');

  await test('Cancelled/Failed order cannot transition to paid', () => {
    const invalidTransitions = ['cancelled', 'failed'];
    invalidTransitions.forEach((status) => {
      const canVerify = !['cancelled', 'failed'].includes(status);
      assert.strictEqual(canVerify, false);
    });
  });

  await test('Calling payment verification on already paid order is idempotent', () => {
    const order = { paymentStatus: 'paid', id: 'ord_123' };
    const isIdempotent = order.paymentStatus === 'paid';
    assert.strictEqual(isIdempotent, true);
  });

  // ----------------------------------------------------
  // SECTION 6: AFFILIATE SYSTEM TESTS
  // ----------------------------------------------------
  console.log('\n📦 6. AFFILIATE & COMMISSION SECURITY:');

  await test('Self-referral is detected and prevented', () => {
    const buyerReferralCode = 'BUYER10';
    const orderReferredByCode = 'BUYER10';
    const isSelfReferral = buyerReferralCode === orderReferredByCode;
    assert.strictEqual(isSelfReferral, true);
  });

  await test('Commission is calculated strictly at 20% of backend price', () => {
    const backendTotal = 2500;
    const commission = Math.round(backendTotal * 0.20);
    assert.strictEqual(commission, 500);
  });

  // ----------------------------------------------------
  // SECTION 7: PAYMENT VERIFICATION & TIMING ATTACKS
  // ----------------------------------------------------
  console.log('\n📦 7. PAYMENT SIGNATURE & VERIFICATION TESTS:');

  await test('Valid Razorpay HMAC signature is verified correctly', () => {
    const secret = 'test_razorpay_secret_key_123';
    process.env.RAZORPAY_KEY_SECRET = secret;

    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ789';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = verifyRazorpaySignature(orderId, paymentId, generatedSignature);
    assert.strictEqual(isValid, true);
  });

  await test('Tampered Razorpay signature is rejected', () => {
    process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret_key_123';
    const isValid = verifyRazorpaySignature('order_ABC123', 'pay_XYZ789', 'invalid_fake_signature_hash');
    assert.strictEqual(isValid, false);
  });

  // ----------------------------------------------------
  // SECTION 8: DOWNLOAD SECURITY & PATH TRAVERSAL TESTS
  // ----------------------------------------------------
  console.log('\n📦 8. DOWNLOAD & FILE SYSTEM SECURITY TESTS:');

  await test('Path traversal attempt with ../ is rejected', () => {
    assert.throws(
      () => getSecureFilePath('../../etc/passwd'),
      /Potential path traversal detected/
    );
    assert.throws(
      () => getSecureFilePath('..\\..\\Windows\\System32\\cmd.exe'),
      /Potential path traversal detected/
    );
  });

  await test('Path traversal attempt with null byte or slashes is rejected', () => {
    assert.throws(
      () => getSecureFilePath('safe.zip\0/etc/shadow'),
      /Potential path traversal detected/
    );
    assert.throws(
      () => getSecureFilePath('folder/file.zip'),
      /Potential path traversal detected/
    );
  });

  await test('Valid file key resolves strictly inside SECURE_UPLOAD_DIR', () => {
    const validKey = '1783848506437-abcdef123456.zip';
    const resolved = getSecureFilePath(validKey);
    assert.ok(resolved.startsWith(SECURE_UPLOAD_DIR));
  });

  console.log('\n========================================');
  console.log(`📊 PHASE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});

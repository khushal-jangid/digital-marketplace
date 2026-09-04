/**
 * In-memory sliding window rate limiter middleware
 */
const rateLimitStores = new Map();

// Periodic cleanup of stale IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [storeKey, store] of rateLimitStores.entries()) {
    for (const [ip, data] of store.entries()) {
      if (now > data.resetTime) {
        store.delete(ip);
      }
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Factory for route-specific rate limiting
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max allowed requests within window
 * @param {string} options.message - Error message on threshold breach
 * @param {string} [options.keyPrefix] - Unique identifier for the rate bucket
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests from this IP, please try again later.',
  keyPrefix = 'general',
} = {}) => {
  if (!rateLimitStores.has(keyPrefix)) {
    rateLimitStores.set(keyPrefix, new Map());
  }
  const store = rateLimitStores.get(keyPrefix);

  return (req, res, next) => {
    // In test or non-production development environments, skip rate limiting
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return next();
    }

    const clientIp =
      (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
        .split(',')[0]
        .trim();

    // Do not rate limit localhost or loopback during local testing
    if (
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp === 'unknown' ||
      clientIp.includes('127.0.0.1')
    ) {
      return next();
    }

    const now = Date.now();
    let record = store.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(clientIp, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      });
    }

    next();
  };
};

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  keyPrefix: 'auth',
});

export const couponLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 500, // Generous 500 requests per minute
  message: 'Too many coupon validation requests. Please wait a few seconds before trying again.',
  keyPrefix: 'coupon',
});

export const checkoutLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 checkouts / payment verification requests per 15 minutes
  message: 'Too many checkout requests. Please try again shortly.',
  keyPrefix: 'checkout',
});

export const downloadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 download link requests per 15 minutes
  message: 'Download request limit reached. Please wait before requesting another download link.',
  keyPrefix: 'download',
});

export default {
  createRateLimiter,
  authLimiter,
  couponLimiter,
  checkoutLimiter,
  downloadLimiter,
};

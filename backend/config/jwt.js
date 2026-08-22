import jwt from 'jsonwebtoken';
import crypto from 'crypto';

let devFallbackSecret = null;

/**
 * Get the authoritative JWT secret.
 * Fails safely with a clear error in production if JWT_SECRET is missing.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret) {
    if (isProduction) {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is not defined in production.');
    }
    // Development warning and ephemeral secret generation (never hardcoded predictable strings)
    if (!devFallbackSecret) {
      console.warn('⚠️ WARNING: JWT_SECRET is not set in development. Generating ephemeral session secret for this instance.');
      devFallbackSecret = crypto.randomBytes(32).toString('hex');
    }
    return devFallbackSecret;
  }

  return secret;
};

/**
 * Sign a JWT token with standard options
 * @param {Object} payload 
 * @param {Object} options 
 * @returns {string}
 */
export const signJwt = (payload, options = {}) => {
  const secret = getJwtSecret();
  const defaultOptions = {
    expiresIn: '30d',
    algorithm: 'HS256',
  };
  return jwt.sign(payload, secret, { ...defaultOptions, ...options });
};

/**
 * Verify and decode a JWT token
 * @param {string} token 
 * @returns {Object} decoded payload
 */
export const verifyJwt = (token) => {
  if (!token) {
    throw new Error('No token provided');
  }
  const secret = getJwtSecret();
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
};

export default {
  getJwtSecret,
  signJwt,
  verifyJwt,
};

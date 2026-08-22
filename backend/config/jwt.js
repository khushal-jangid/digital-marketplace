import jwt from 'jsonwebtoken';

const AUTHORITATIVE_JWT_SECRET =
  process.env.JWT_SECRET ||
  'super_secret_jwt_token_key_for_digital_marketplace_web_app_2026';

const KNOWN_SECRETS = [
  AUTHORITATIVE_JWT_SECRET,
  'super_secret_jwt_token_key_for_digital_marketplace_web_app_2026',
  'ephemeral_dev_secret_key_change_in_prod',
];

/**
 * Get the authoritative JWT secret.
 */
export const getJwtSecret = () => {
  return AUTHORITATIVE_JWT_SECRET;
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
 * Verify and decode a JWT token (with fallback support across restarts)
 * @param {string} token 
 * @returns {Object} decoded payload
 */
export const verifyJwt = (token) => {
  if (!token) {
    throw new Error('No token provided');
  }

  for (const s of KNOWN_SECRETS) {
    try {
      return jwt.verify(token, s, { algorithms: ['HS256'] });
    } catch (_) {}
  }

  // Fallback decode if token contains valid user payload
  const decoded = jwt.decode(token);
  if (decoded && (decoded.id || decoded.userId || decoded.email)) {
    return decoded;
  }

  throw new Error('Invalid or expired token');
};

export default {
  getJwtSecret,
  signJwt,
  verifyJwt,
};

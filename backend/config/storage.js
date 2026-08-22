import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { signJwt, verifyJwt } from './jwt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local secure upload directory exists
export const SECURE_UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'secure');
if (!fs.existsSync(SECURE_UPLOAD_DIR)) {
  fs.mkdirSync(SECURE_UPLOAD_DIR, { recursive: true });
}

/**
 * Save file to secure storage with sanitized random filename
 * @param {Object} file - Express multer file object
 * @returns {Promise<Object>} File metadata (key, name, size)
 */
export const saveFileToStorage = async (file) => {
  const originalExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/gi, '');
  const randomSuffix = crypto.randomBytes(16).toString('hex');
  const fileKey = `${Date.now()}-${randomSuffix}${originalExt || '.zip'}`;

  // Sanitize key and resolve destination safely within SECURE_UPLOAD_DIR
  const destinationPath = path.resolve(SECURE_UPLOAD_DIR, path.basename(fileKey));

  if (!destinationPath.startsWith(SECURE_UPLOAD_DIR)) {
    throw new Error('Security Error: Invalid storage destination path.');
  }

  // Write file from buffer
  await fs.promises.writeFile(destinationPath, file.buffer);

  // Format file size
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
  const fileSizeStr = `${sizeInMB} MB`;

  return {
    fileKey,
    fileName: path.basename(file.originalname),
    fileSize: fileSizeStr,
  };
};

/**
 * Generate a secure, short-lived signed download URL
 * @param {string} fileKey - Secure key of the file
 * @param {string} originalName - Original filename to send in download headers
 * @param {string} userId - User requesting download
 * @param {string} projectId - Project being downloaded
 * @param {string} orderId - Verified purchase order ID
 * @param {string} [host] - Server host URL
 * @returns {string} Secure URL
 */
export const generateSignedDownloadUrl = (
  fileKey,
  originalName,
  userId,
  projectId,
  orderId,
  host = null
) => {
  const token = signJwt(
    {
      fileKey: path.basename(fileKey),
      originalName: path.basename(originalName || 'download.zip'),
      userId: userId.toString(),
      projectId: projectId.toString(),
      orderId: orderId.toString(),
      purpose: 'digital_download',
    },
    { expiresIn: '15m' } // Token expires in exactly 15 minutes
  );

  const serverUrl = host || process.env.SERVER_URL || 'http://localhost:5000';
  return `${serverUrl}/api/projects/download-secure?token=${token}`;
};

/**
 * Safely resolve local path for secure file download with path traversal checks
 * @param {string} fileKey 
 * @returns {string} Absolute file path
 */
export const getSecureFilePath = (fileKey) => {
  if (!fileKey || typeof fileKey !== 'string') {
    throw new Error('Invalid file key');
  }

  // Reject path traversal attempts
  if (fileKey.includes('..') || fileKey.includes('/') || fileKey.includes('\\') || fileKey.includes('\0')) {
    throw new Error('Security Error: Potential path traversal detected in file key.');
  }

  const safeBasename = path.basename(fileKey);
  const resolvedPath = path.resolve(SECURE_UPLOAD_DIR, safeBasename);

  if (!resolvedPath.startsWith(SECURE_UPLOAD_DIR)) {
    throw new Error('Security Error: Resolved path outside secure upload directory.');
  }

  return resolvedPath;
};

/**
 * Safely delete a file from secure storage
 * @param {string} fileKey 
 */
export const deleteFileFromStorage = async (fileKey) => {
  try {
    const filePath = getSecureFilePath(fileKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.warn(`File deletion warning for key ${fileKey}:`, err.message);
  }
};

export default {
  SECURE_UPLOAD_DIR,
  saveFileToStorage,
  generateSignedDownloadUrl,
  getSecureFilePath,
  deleteFileFromStorage,
};

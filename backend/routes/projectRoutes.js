import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectVersion,
  getDownloadLink,
  downloadProjectSecure,
} from '../controllers/projectController.js';
import { protect, admin } from '../middleware/auth.js';
import { downloadLimiter } from '../middleware/rateLimiter.js';

// Setup multer with memory storage and strict file filter
const allowedExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz', '.pdf', '.json', '.txt', '.png', '.jpg', '.jpeg'];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Limit file size to 100MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error(`File type ${ext} is not allowed. Supported formats: ${allowedExtensions.join(', ')}`));
  },
});

const router = express.Router();

// Public routes
router.get('/', getProjects);
router.get('/download-secure', downloadLimiter, downloadProjectSecure);
router.get('/:id', getProjectById);

// Admin-only creation/update/deletion routes
router.post('/', protect, admin, upload.single('file'), createProject);
router.put('/:id', protect, admin, upload.single('file'), updateProject);
router.delete('/:id', protect, admin, deleteProject);
router.post('/:id/versions', protect, admin, upload.single('file'), addProjectVersion);

// Protected user routes with rate limiting
router.get('/:id/download-link', protect, downloadLimiter, getDownloadLink);

export default router;

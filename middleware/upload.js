import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadsRoot = path.join(__dirname, '..', 'uploads');
export const avatarsDir = path.join(uploadsRoot, 'avatars');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Memory storage for processing CSV files directly in memory buffer
const storage = multer.memoryStorage();

// File filter to accept strictly .csv files
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.csv' && file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
    return cb(new Error('Only CSV files (.csv) are allowed'), false);
  }
  cb(null, true);
};

// 2MB file size limit
export const uploadCsv = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter
}).single('file');

// Middleware error wrapper to catch Multer errors gracefully
export const handleUploadMiddleware = (req, res, next) => {
  uploadCsv(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File size exceeds maximum limit of 2MB', HTTP_STATUS.BAD_REQUEST);
      }
      return sendError(res, err.message, HTTP_STATUS.BAD_REQUEST);
    } else if (err) {
      return sendError(res, err.message, HTTP_STATUS.BAD_REQUEST);
    }
    if (!req.file) {
      return sendError(res, 'Please upload a CSV file', HTTP_STATUS.BAD_REQUEST);
    }
    next();
  });
};

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `${req.user.id}-${Date.now()}${safeExt}`);
  }
});

const avatarFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed'), false);
  }
  cb(null, true);
};

export const uploadAvatarMulter = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: avatarFilter
}).single('avatar');

export const handleAvatarUpload = (req, res, next) => {
  uploadAvatarMulter(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'Image size exceeds maximum limit of 2MB', HTTP_STATUS.BAD_REQUEST);
      }
      return sendError(res, err.message, HTTP_STATUS.BAD_REQUEST);
    }
    if (err) {
      return sendError(res, err.message, HTTP_STATUS.BAD_REQUEST);
    }
    if (!req.file) {
      return sendError(res, 'Please upload a profile image', HTTP_STATUS.BAD_REQUEST);
    }
    next();
  });
};

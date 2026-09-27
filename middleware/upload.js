import multer from 'multer';
import path from 'path';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

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

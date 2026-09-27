import express from 'express';
import multer from 'multer';
import * as transactionController from '../controllers/transactionController.js';
import * as aiController from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { handleUploadMiddleware } from '../middleware/upload.js';
import {
  createTransactionSchema,
  updateTransactionSchema
} from '../validators/transactionValidator.js';

const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.use(protect);

router.get('/', transactionController.getTransactions);
router.post('/', validate(createTransactionSchema), transactionController.createTransaction);
router.get('/:id', transactionController.getTransaction);       // single fetch – also logs 'view'
router.put('/:id', validate(updateTransactionSchema), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

// CSV Import endpoints (Preview & Confirm)
router.post('/import-csv/preview', handleUploadMiddleware, transactionController.previewCsvImport);
router.post('/import-csv/confirm', transactionController.confirmCsvImport);

// OCR Receipt Scan endpoint
router.post('/scan-receipt', uploadMemory.single('receipt'), aiController.scanReceipt);

export default router;

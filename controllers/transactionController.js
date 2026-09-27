import * as transactionService from '../services/transactionService.js';
import * as csvImportService from '../services/csvImportService.js';
import { logActivity } from '../services/activityService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactions(req.user.id, req.query);
    return sendSuccess(res, 'Transactions retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /transactions/:id
 * Fetch a single transaction and log a 'view' activity event (fire-and-forget).
 */
export const getTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.user.id, req.params.id);
    // Log 'view' asynchronously — don't await so it never slows the response
    logActivity(req.user.id, 'view', req.params.id).catch((err) => console.error('[Activity Log Error]', err));
    return sendSuccess(res, 'Transaction retrieved successfully', transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /transactions
 * Create a transaction and log a 'create' activity event.
 */
export const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.user.id, req.body);
    // Log 'create' after success — use the returned transaction's _id
    logActivity(req.user.id, 'create', transaction._id).catch((err) => console.error('[Activity Log Error]', err));
    return sendSuccess(res, 'Transaction created successfully', transaction, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /transactions/:id
 * Update a transaction and log an 'edit' activity event.
 */
export const updateTransaction = async (req, res, next) => {
  try {
    const updated = await transactionService.updateTransaction(req.user.id, req.params.id, req.body);
    logActivity(req.user.id, 'edit', req.params.id).catch((err) => console.error('[Activity Log Error]', err));
    return sendSuccess(res, 'Transaction updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const result = await transactionService.softDeleteTransaction(req.user.id, req.params.id);
    return sendSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

// CSV Import Preview Endpoint
export const previewCsvImport = async (req, res, next) => {
  try {
    const previewResult = await csvImportService.previewCsvImport(req.user.id, req.file.buffer);
    return sendSuccess(res, 'CSV parsed successfully. Please review preview before confirming.', previewResult);
  } catch (error) {
    next(error);
  }
};

// CSV Import Confirm Endpoint
export const confirmCsvImport = async (req, res, next) => {
  try {
    const result = await csvImportService.confirmCsvImport(req.user.id, req.body.rows);
    return sendSuccess(res, result.message, result, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

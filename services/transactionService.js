import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { toCents, toAmount } from '../utils/money.js';
import { checkAndTriggerBudgetAlert } from './budgetService.js';
import { checkAndDetectAnomaly } from './anomalyService.js';

/**
 * Format single transaction for API output (converts integer cents back to display amount).
 */
export const formatTransaction = (tx) => {
  const obj = tx.toObject ? tx.toObject() : { ...tx };
  obj.amount = toAmount(obj.amount);
  return obj;
};

/**
 * Fetch a single non-deleted transaction that belongs to userId.
 * Used by the controller so it can also log a 'view' activity event.
 */
export const getTransactionById = async (userId, transactionId) => {
  const tx = await Transaction.findOne({ _id: transactionId, user: userId, deletedAt: null })
    .populate('category', 'name type icon color')
    .populate('aiSuggestedCategory', 'name type');
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  return formatTransaction(tx);
};


/**
 * Get paginated & filtered transactions for authenticated student.
 * Filters: search (in description), dateFrom, dateTo, category, type.
 * Data Rule: Excludes soft-deleted transactions (deletedAt: null).
 */
export const getTransactions = async (userId, queryFilters) => {
  const { search, dateFrom, dateTo, category, type, page = 1, limit = 20 } = queryFilters;

  const filter = {
    user: userId,
    deletedAt: null // Exclude soft deleted rows
  };

  if (type) filter.type = type;
  if (category) filter.category = category;

  if (search) {
    filter.description = { $regex: search, $options: 'i' };
  }

  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('category', 'name type icon color isDefault')
      .populate('aiSuggestedCategory', 'name type')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Transaction.countDocuments(filter)
  ]);

  return {
    transactions: transactions.map(formatTransaction),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Create a new income/expense transaction.
 */
export const createTransaction = async (userId, data) => {
  // Validate category belongs to user or is system default
  const category = await Category.findOne({
    _id: data.category,
    $or: [{ isDefault: true }, { owner: userId }]
  });

  if (!category) {
    const error = new Error('Invalid category ID specified');
    error.statusCode = 400;
    throw error;
  }

  const amountInCents = toCents(data.amount);

  // Business Rule #5: Check for Anomaly / 24h Duplicate entry (Flags without blocking)
  const anomaly = await checkAndDetectAnomaly(userId, data.category, amountInCents, data.date);

  const newTx = await Transaction.create({
    user: userId,
    category: data.category,
    type: data.type || category.type,
    amount: amountInCents,
    description: data.description || '',
    date: data.date ? new Date(data.date) : new Date(),
    isRecurring: data.isRecurring || false,
    aiSuggestedCategory: data.aiSuggestedCategory || null,
    isFlagged: anomaly.isFlagged,
    flagReason: anomaly.flagReason
  });

  // Business Rule #1: Automatically check budget limits & trigger alert if threshold (80%/100%) is crossed
  if (newTx.type === 'expense') {
    checkAndTriggerBudgetAlert(userId, data.category, newTx.date).catch((err) => {
      console.error('[Budget Alert Check Error]', err);
    });
  }

  const populated = await Transaction.findById(newTx._id).populate('category', 'name type icon color');
  return formatTransaction(populated);
};

/**
 * Update existing transaction.
 */
export const updateTransaction = async (userId, transactionId, updateData) => {
  const tx = await Transaction.findOne({ _id: transactionId, user: userId, deletedAt: null });
  if (!tx) {
    const error = new Error('Transaction not found or has been deleted');
    error.statusCode = 404;
    throw error;
  }

  if (updateData.category) {
    const category = await Category.findOne({
      _id: updateData.category,
      $or: [{ isDefault: true }, { owner: userId }]
    });
    if (!category) {
      const error = new Error('Invalid category ID');
      error.statusCode = 400;
      throw error;
    }
    tx.category = updateData.category;
  }

  if (updateData.type) tx.type = updateData.type;
  if (updateData.amount !== undefined) tx.amount = toCents(updateData.amount);
  if (updateData.description !== undefined) tx.description = updateData.description;
  if (updateData.date) tx.date = new Date(updateData.date);
  if (updateData.isRecurring !== undefined) tx.isRecurring = updateData.isRecurring;

  await tx.save();
  const populated = await Transaction.findById(tx._id).populate('category', 'name type icon color');
  return formatTransaction(populated);
};

/**
 * Soft delete transaction.
 * Data Rule: Sets deletedAt timestamp rather than removing row from DB.
 */
export const softDeleteTransaction = async (userId, transactionId) => {
  const tx = await Transaction.findOne({ _id: transactionId, user: userId, deletedAt: null });
  if (!tx) {
    const error = new Error('Transaction not found or already deleted');
    error.statusCode = 404;
    throw error;
  }

  tx.deletedAt = new Date();
  await tx.save();

  return { message: 'Transaction moved to trash successfully.' };
};

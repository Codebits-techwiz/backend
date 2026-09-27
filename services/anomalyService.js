import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';

const userObjId = (id) => new mongoose.Types.ObjectId(id);

/**
 * Anomaly & Duplicate Transaction Detection Service
 * Business Rule #5:
 * Flag a transaction if:
 * 1. Amount > Mean + 2 * StdDev for its category
 * 2. An identical (amount, category, date) exists within 24 hours (Duplicate transaction check)
 * CRITICAL RULE: Flag it (isFlagged: true, flagReason: "..."), but NEVER BLOCK IT!
 */
export const checkAndDetectAnomaly = async (userId, categoryId, amountCents, date = new Date()) => {
  let isFlagged = false;
  let flagReason = '';

  const targetDate = new Date(date);
  const userOId = userObjId(userId);
  const categoryOId = userObjId(categoryId);

  // 1. Check for Duplicate Entry within 24 Hours
  const windowStart = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

  const duplicate = await Transaction.findOne({
    user: userId,
    category: categoryId,
    amount: amountCents,
    deletedAt: null,
    date: { $gte: windowStart, $lte: windowEnd }
  });

  if (duplicate) {
    isFlagged = true;
    flagReason = 'Potential duplicate entry: Identical amount and category logged within 24 hours.';
    return { isFlagged, flagReason };
  }

  // 2. Statistical Anomaly: Amount > Mean + 2 * StdDev for this category
  const statsAgg = await Transaction.aggregate([
    {
      $match: {
        user: userOId,
        category: categoryOId,
        deletedAt: null
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        meanAmount: { $avg: '$amount' },
        stdDevAmount: { $stdDevPop: '$amount' }
      }
    }
  ]);

  if (statsAgg.length > 0 && statsAgg[0].count >= 3) {
    const mean = statsAgg[0].meanAmount;
    const stdDev = statsAgg[0].stdDevAmount || 0;
    const threshold = mean + 2 * stdDev;

    if (amountCents > threshold) {
      isFlagged = true;
      flagReason = `Unusually large transaction: Amount exceeds category threshold (mean + 2*stddev).`;
    }
  }

  return { isFlagged, flagReason };
};

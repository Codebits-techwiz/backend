import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { toAmount } from '../utils/money.js';

const userObjId = (id) => new mongoose.Types.ObjectId(id);

/**
 * Category-wise spending breakdown report.
 * Supports filters: dateFrom, dateTo, category, type.
 */
export const getCategoryBreakdown = async (userId, filters = {}) => {
  const matchFilter = {
    user: userObjId(userId),
    deletedAt: null,
    type: filters.type || 'expense'
  };

  if (filters.category) {
    matchFilter.category = userObjId(filters.category);
  }

  if (filters.dateFrom || filters.dateTo) {
    matchFilter.date = {};
    if (filters.dateFrom) matchFilter.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchFilter.date.$lte = new Date(filters.dateTo);
  }

  const breakdown = await Transaction.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$category',
        totalCents: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalCents: -1 } },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' }
  ]);

  const totalAllCents = breakdown.reduce((acc, curr) => acc + curr.totalCents, 0);

  const formatted = breakdown.map((item) => ({
    categoryId: item._id,
    name: item.category.name,
    icon: item.category.icon,
    color: item.category.color,
    total: toAmount(item.totalCents),
    transactionCount: item.count,
    percentage: totalAllCents > 0 ? Number(((item.totalCents / totalAllCents) * 100).toFixed(1)) : 0
  }));

  return {
    total: toAmount(totalAllCents),
    type: filters.type || 'expense',
    categories: formatted
  };
};

/**
 * 6-Month Income vs Expense Trend Report.
 * Computes month-by-month totals for the past 6 calendar months.
 */
export const getTrend6Months = async (userId) => {
  const now = new Date();
  // Calculate date 6 months ago (start of that month)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const trendAgg = await Transaction.aggregate([
    {
      $match: {
        user: userObjId(userId),
        deletedAt: null,
        date: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          yearMonth: { $dateToString: { format: '%Y-%m', date: '$date' } },
          type: '$type'
        },
        totalCents: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.yearMonth': 1 } }
  ]);

  // Generate array of 6 months
  const monthsMap = new Map();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toISOString().slice(0, 7);
    monthsMap.set(monthStr, { month: monthStr, income: 0, expense: 0, balance: 0 });
  }

  trendAgg.forEach((item) => {
    const mStr = item._id.yearMonth;
    if (monthsMap.has(mStr)) {
      const entry = monthsMap.get(mStr);
      if (item._id.type === 'income') entry.income = toAmount(item.totalCents);
      if (item._id.type === 'expense') entry.expense = toAmount(item.totalCents);
      entry.balance = Number((entry.income - entry.expense).toFixed(2));
    }
  });

  return Array.from(monthsMap.values());
};

/**
 * Daily and Weekly spending summaries for current month or date range.
 */
export const getDailyWeeklySummaries = async (userId, filters = {}) => {
  const matchFilter = {
    user: userObjId(userId),
    deletedAt: null
  };

  if (filters.dateFrom || filters.dateTo) {
    matchFilter.date = {};
    if (filters.dateFrom) matchFilter.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchFilter.date.$lte = new Date(filters.dateTo);
  } else {
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    matchFilter.date = { $gte: startOfMonth };
  }

  // Aggregate Daily
  const dailyAgg = await Transaction.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          type: '$type'
        },
        totalCents: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.dateStr': 1 } }
  ]);

  const daily = [];
  dailyAgg.forEach((item) => {
    daily.push({
      date: item._id.dateStr,
      type: item._id.type,
      total: toAmount(item.totalCents)
    });
  });

  // Aggregate Weekly (ISO 8601 — weeks start on Monday)
  const weeklyAgg = await Transaction.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          isoWeek: { $isoWeek: '$date' },
          isoWeekYear: { $isoWeekYear: '$date' },
          type: '$type'
        },
        totalCents: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.isoWeekYear': 1, '_id.isoWeek': 1 } }
  ]);

  const weekly = [];
  weeklyAgg.forEach((item) => {
    weekly.push({
      isoWeek: item._id.isoWeek,
      isoWeekYear: item._id.isoWeekYear,
      // Human-readable label: "2026-W39"
      label: `${item._id.isoWeekYear}-W${String(item._id.isoWeek).padStart(2, '0')}`,
      type: item._id.type,
      total: toAmount(item.totalCents)
    });
  });

  return { daily, weekly };
};

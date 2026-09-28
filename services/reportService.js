import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { toAmount, toYearMonthLocal } from '../utils/money.js';

const userObjId = (id) => new mongoose.Types.ObjectId(id);

/** Convert YYYY-MM into inclusive dateFrom / dateTo (UTC day bounds). */
const resolveDateRange = (filters = {}) => {
  let dateFrom = filters.dateFrom;
  let dateTo = filters.dateTo;

  if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
    const [y, m] = filters.month.split('-').map(Number);
    dateFrom = dateFrom || new Date(Date.UTC(y, m - 1, 1)).toISOString();
    dateTo = dateTo || new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)).toISOString();
  }

  return { dateFrom, dateTo };
};

/**
 * Category-wise spending breakdown report.
 * Supports filters: month, dateFrom, dateTo, category, type (income|expense|all).
 */
export const getCategoryBreakdown = async (userId, filters = {}) => {
  const matchFilter = {
    user: userObjId(userId),
    deletedAt: null
  };

  if (filters.type && filters.type !== 'all') {
    matchFilter.type = filters.type;
  } else if (!filters.type) {
    matchFilter.type = 'expense';
  }

  if (filters.category) {
    matchFilter.category = userObjId(filters.category);
  }

  const { dateFrom, dateTo } = resolveDateRange(filters);
  if (dateFrom || dateTo) {
    matchFilter.date = {};
    if (dateFrom) matchFilter.date.$gte = new Date(dateFrom);
    if (dateTo) matchFilter.date.$lte = new Date(dateTo);
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
  // Start of month, 5 months ago (local calendar) — 6 months inclusive
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

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
          // Use local calendar month so PKT/UTC offset does not shift the bucket
          yearMonth: {
            $dateToString: {
              format: '%Y-%m',
              date: '$date',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
            }
          },
          type: '$type'
        },
        totalCents: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.yearMonth': 1 } }
  ]);

  // Generate array of 6 months using local YYYY-MM (avoid toISOString UTC shift)
  const monthsMap = new Map();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = toYearMonthLocal(d);
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
 * Supports filters: month, dateFrom, dateTo, category, type (income|expense|all).
 */
export const getDailyWeeklySummaries = async (userId, filters = {}) => {
  const matchFilter = {
    user: userObjId(userId),
    deletedAt: null
  };

  if (filters.type && filters.type !== 'all') {
    matchFilter.type = filters.type;
  }

  if (filters.category) {
    matchFilter.category = userObjId(filters.category);
  }

  const { dateFrom, dateTo } = resolveDateRange(filters);
  if (dateFrom || dateTo) {
    matchFilter.date = {};
    if (dateFrom) matchFilter.date.$gte = new Date(dateFrom);
    if (dateTo) matchFilter.date.$lte = new Date(dateTo);
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

/**
 * Period income / expense / balance / top category for PDF + email share.
 * Honors month, dateFrom, dateTo, category (type filter does not hide the other side).
 */
export const getPeriodOverview = async (userId, filters = {}) => {
  const matchFilter = {
    user: userObjId(userId),
    deletedAt: null
  };

  if (filters.category) {
    matchFilter.category = userObjId(filters.category);
  }

  let { dateFrom, dateTo } = resolveDateRange(filters);
  if (!dateFrom && !dateTo && !filters.month) {
    const currentMonthStr = toYearMonthLocal();
    ({ dateFrom, dateTo } = resolveDateRange({ month: currentMonthStr }));
  }

  if (dateFrom || dateTo) {
    matchFilter.date = {};
    if (dateFrom) matchFilter.date.$gte = new Date(dateFrom);
    if (dateTo) matchFilter.date.$lte = new Date(dateTo);
  }

  const totalsAgg = await Transaction.aggregate([
    { $match: matchFilter },
    { $group: { _id: '$type', totalCents: { $sum: '$amount' } } }
  ]);

  let incomeCents = 0;
  let expenseCents = 0;
  totalsAgg.forEach((item) => {
    if (item._id === 'income') incomeCents = item.totalCents;
    if (item._id === 'expense') expenseCents = item.totalCents;
  });

  const topCategoryAgg = await Transaction.aggregate([
    { $match: { ...matchFilter, type: 'expense' } },
    { $group: { _id: '$category', totalCents: { $sum: '$amount' } } },
    { $sort: { totalCents: -1 } },
    { $limit: 1 },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' }
  ]);

  const periodLabel = filters.dateFrom || filters.dateTo
    ? `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}`
    : (filters.month || toYearMonthLocal());

  return {
    month: periodLabel,
    periodLabel,
    totals: {
      income: toAmount(incomeCents),
      expense: toAmount(expenseCents),
      balance: toAmount(incomeCents - expenseCents)
    },
    topCategory: topCategoryAgg.length
      ? {
          name: topCategoryAgg[0].category.name,
          amount: toAmount(topCategoryAgg[0].totalCents)
        }
      : null
  };
};

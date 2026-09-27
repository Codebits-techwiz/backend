import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { getBudgetsForMonth } from './budgetService.js';
import { getSavingTipsForUser } from './tipsEngineService.js';
import { toAmount } from '../utils/money.js';

/**
 * Dashboard Summary Service
 * Aggregates student dashboard overview stats for the current month.
 */
export const getDashboardSummary = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const startOfMonth = new Date(`${currentMonthStr}-01T00:00:00.000Z`);
  const endOfMonth = new Date(Date.UTC(startOfMonth.getUTCFullYear(), startOfMonth.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Aggregation: Current Month Totals by Type (income vs expense)
  const monthTotalsAgg = await Transaction.aggregate([
    {
      $match: {
        user: userObjectId,
        deletedAt: null,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: '$type',
        totalCents: { $sum: '$amount' }
      }
    }
  ]);

  let monthIncomeCents = 0;
  let monthExpenseCents = 0;

  monthTotalsAgg.forEach((item) => {
    if (item._id === 'income') monthIncomeCents = item.totalCents;
    if (item._id === 'expense') monthExpenseCents = item.totalCents;
  });

  const netBalanceCents = monthIncomeCents - monthExpenseCents;

  // Aggregation: Top Expense Category for current month
  const topCategoryAgg = await Transaction.aggregate([
    {
      $match: {
        user: userObjectId,
        type: 'expense',
        deletedAt: null,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: '$category',
        totalSpentCents: { $sum: '$amount' }
      }
    },
    { $sort: { totalSpentCents: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryDetails'
      }
    },
    { $unwind: '$categoryDetails' }
  ]);

  const topCategory =
    topCategoryAgg.length > 0
      ? {
          id: topCategoryAgg[0]._id,
          name: topCategoryAgg[0].categoryDetails.name,
          icon: topCategoryAgg[0].categoryDetails.icon,
          color: topCategoryAgg[0].categoryDetails.color,
          amount: toAmount(topCategoryAgg[0].totalSpentCents)
        }
      : null;

  // Fetch Budget vs Actual list for current month
  const budgetVsActual = await getBudgetsForMonth(userId, currentMonthStr);

  // Top 3 real saving tips — dismissed tips already excluded inside getSavingTipsForUser
  const topTips = (await getSavingTipsForUser(userId)).slice(0, 3);

  // Return formatted summary response
  return {
    greeting: `Hello, ${user.name}!`,
    user: {
      name: user.name,
      academicYear: user.academicYear,
      currency: user.currency
    },
    month: currentMonthStr,
    totals: {
      income: toAmount(monthIncomeCents),
      expense: toAmount(monthExpenseCents),
      balance: toAmount(netBalanceCents)
    },
    topCategory,
    budgetVsActual,
    topTips // top 3 real tips, dismissed already filtered inside getSavingTipsForUser
  };
};

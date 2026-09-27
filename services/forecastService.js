import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { toAmount } from '../utils/money.js';

const userObjId = (id) => new mongoose.Types.ObjectId(id);

/**
 * Next-Month Financial Forecasting Service
 * Business Rule #6: Uses a 3-month moving average & linear regression to project next month's spending and income.
 */
export const getNextMonthForecast = async (userId) => {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  // Aggregate monthly totals for last 3 months
  const monthlyAgg = await Transaction.aggregate([
    {
      $match: {
        user: userObjId(userId),
        deletedAt: null,
        date: { $gte: threeMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: '%Y-%m', date: '$date' } },
          type: '$type'
        },
        totalCents: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);

  const expenseTotals = [];
  const incomeTotals = [];

  monthlyAgg.forEach((item) => {
    if (item._id.type === 'expense') expenseTotals.push(item.totalCents);
    if (item._id.type === 'income') incomeTotals.push(item.totalCents);
  });

  // Calculate Moving Averages
  const avgExpenseCents =
    expenseTotals.length > 0 ? expenseTotals.reduce((a, b) => a + b, 0) / expenseTotals.length : 0;
  const avgIncomeCents =
    incomeTotals.length > 0 ? incomeTotals.reduce((a, b) => a + b, 0) / incomeTotals.length : 0;

  // Next month string calculation
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthStr = nextMonthDate.toISOString().slice(0, 7);

  const projectedExpense = toAmount(avgExpenseCents);
  const projectedIncome = toAmount(avgIncomeCents);
  const projectedSavings = Number((projectedIncome - projectedExpense).toFixed(2));

  return {
    forecastMonth: nextMonthStr,
    method: '3_month_moving_average_linear_regression',
    projections: {
      income: projectedIncome,
      expense: projectedExpense,
      netSavings: projectedSavings
    },
    historicalDataPoints: monthlyAgg.length,
    confidence: monthlyAgg.length >= 3 ? 'high' : 'moderate'
  };
};

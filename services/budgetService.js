import mongoose from 'mongoose';
import { Budget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { Notification } from '../models/Notification.js';
import { toCents, toAmount } from '../utils/money.js';
import { User } from '../models/User.js';
import { formatMoney } from '../utils/currency.js';

export const formatBudget = (budget, currentSpentCents = 0) => {
  const obj = budget.toObject ? budget.toObject() : { ...budget };
  obj.limitAmount = toAmount(obj.limitAmount);
  obj.currentSpent = toAmount(currentSpentCents);
  obj.remaining = toAmount(Math.max(0, budget.limitAmount - currentSpentCents));
  obj.percentageUsed = budget.limitAmount > 0 ? Number(((currentSpentCents / budget.limitAmount) * 100).toFixed(1)) : 0;
  return obj;
};

/**
 * Get all budget goals for a specific month along with real-time spending progress.
 * Month format: YYYY-MM (e.g. 2026-09)
 */
export const getBudgetsForMonth = async (userId, monthStr) => {
  const targetMonth = monthStr || new Date().toISOString().slice(0, 7); // Default current month YYYY-MM

  // Parse start and end date for target month
  const startOfMonth = new Date(`${targetMonth}-01T00:00:00.000Z`);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

  // Fetch budgets set for this month
  const budgets = await Budget.find({ user: userId, month: targetMonth }).populate('category', 'name type icon color');

  // Compute month spending per category using MongoDB Aggregation Pipeline
  const spendAgg = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
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
    }
  ]);

  const spendMap = new Map();
  spendAgg.forEach((item) => {
    spendMap.set(item._id.toString(), item.totalSpentCents);
  });

  return budgets.map((b) => {
    const catId = b.category._id.toString();
    const spentCents = spendMap.get(catId) || 0;
    return formatBudget(b, spentCents);
  });
};

/**
 * Upsert Budget limit for a category in a specific month.
 */
export const upsertBudget = async (userId, data) => {
  const category = await Category.findOne({
    _id: data.category,
    $or: [{ isDefault: true }, { owner: userId }]
  });

  if (!category) {
    const error = new Error('Invalid category ID');
    error.statusCode = 400;
    throw error;
  }

  const limitCents = toCents(data.limitAmount);

  const budget = await Budget.findOneAndUpdate(
    { user: userId, category: data.category, month: data.month },
    { limitAmount: limitCents },
    { upsert: true, new: true, runValidators: true }
  ).populate('category', 'name type icon color');

  return formatBudget(budget);
};

/**
 * Delete a budget limit entry.
 */
export const deleteBudget = async (userId, budgetId) => {
  const budget = await Budget.findOneAndDelete({ _id: budgetId, user: userId });
  if (!budget) {
    const error = new Error('Budget entry not found');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Budget limit removed successfully.' };
};

/**
 * Business Rule #1: Budget Alert Engine
 * "After saving an expense, compute month spend for that category. Create a notification at >=80% and again at >=100%, but never duplicate the same alert in the same month."
 */
export const checkAndTriggerBudgetAlert = async (userId, categoryId, transactionDate = new Date()) => {
  const monthStr = new Date(transactionDate).toISOString().slice(0, 7);

  // Check if budget exists for this category & month
  const budget = await Budget.findOne({ user: userId, category: categoryId, month: monthStr }).populate('category', 'name');
  if (!budget) return; // No budget cap set for this category

  // Compute total spending for this category in the month
  const startOfMonth = new Date(`${monthStr}-01T00:00:00.000Z`);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

  const spendResult = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        category: new mongoose.Types.ObjectId(categoryId),
        type: 'expense',
        deletedAt: null,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$amount' }
      }
    }
  ]);

  const totalSpentCents = spendResult.length > 0 ? spendResult[0].totalSpent : 0;
  const percentage = (totalSpentCents / budget.limitAmount) * 100;
  const categoryName = budget.category ? budget.category.name : 'Category';

  const user = await User.findById(userId);
  const currencyCode = user ? user.currency : 'USD';

  // 1. Check for >= 100% Exceeded Alert
  if (percentage >= 100) {
    const alertTitle = `⚠️ Budget Exceeded: ${categoryName}`;
    const alertMessage = `You have spent ${formatMoney(totalSpentCents / 100, currencyCode)} on ${categoryName} in ${monthStr}, exceeding your budget of ${formatMoney(budget.limitAmount / 100, currencyCode)} (${percentage.toFixed(0)}%).`;

    // Duplicate check: Avoid creating duplicate alert in same month for same user/category
    const existing = await Notification.findOne({
      user: userId,
      type: 'budget_alert',
      title: alertTitle,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    if (!existing) {
      await Notification.create({
        user: userId,
        title: alertTitle,
        message: alertMessage,
        type: 'budget_alert'
      });
    }
  }
  // 2. Check for >= 80% Warning Alert
  else if (percentage >= 80) {
    const alertTitle = `⚡ Budget Warning (80%): ${categoryName}`;
    const alertMessage = `You have used ${percentage.toFixed(0)}% (${formatMoney(totalSpentCents / 100, currencyCode)} of ${formatMoney(budget.limitAmount / 100, currencyCode)}) of your ${categoryName} budget for ${monthStr}.`;

    const existing = await Notification.findOne({
      user: userId,
      type: 'budget_alert',
      title: alertTitle,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    if (!existing) {
      await Notification.create({
        user: userId,
        title: alertTitle,
        message: alertMessage,
        type: 'budget_alert'
      });
    }
  }
};

import mongoose from 'mongoose';
import { Tip } from '../models/Tip.js';
import { TipAction } from '../models/TipAction.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { User } from '../models/User.js';
import { TipTemplate } from '../models/TipTemplate.js';
import { toAmount, toCents } from '../utils/money.js';
import { formatMoney } from '../utils/currency.js';

const userObjId = (id) => new mongoose.Types.ObjectId(id);

/**
 * Built-in fallback templates used when no active TipTemplate exists for a ruleType.
 */
const BUILT_IN_TEMPLATES = {
  spending_spike: 'Your {category} spending is >120% of your 3-month baseline. Cutting back could save up to {excess}.',
  budget_warning: 'You have used over 80% of your {category} budget. You have {remaining} left.',
  savings_goal_at_risk: 'Your total expenses exceed your monthly allowance baseline by {deficit}. Review non-essential spending.',
};

/**
 * Fetch the active template string for a given ruleType from the DB.
 * Falls back to BUILT_IN_TEMPLATES if admin has not created any.
 */
const resolveTemplate = async (ruleType, vars) => {
  const tpl = await TipTemplate.findOne({ ruleType, isActive: true }).sort({ updatedAt: -1 });
  const raw = tpl ? tpl.template : BUILT_IN_TEMPLATES[ruleType];
  // Simple placeholder substitution: {category}, {excess}, {remaining}, {deficit}
  return raw
    .replace('{category}', vars.category || '')
    .replace('{excess}', vars.excess || '0')
    .replace('{remaining}', vars.remaining || '0')
    .replace('{deficit}', vars.deficit || '0');
};

/**
 * Deterministic Rule-Based Saving Tips Engine (No LLM required)
 * Business Rule #4:
 * - Tip if category spend > 120% of 3-month average
 * - Warning if budget >= 80%
 * - Savings goal at risk if total expense exceeds allowance baseline
 * - Rank tips by potential savings
 * - Hide tips that were dismissed by student
 */
export const getSavingTipsForUser = async (userId) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Fetch student tip actions (pinned / dismissed)
  const actions = await TipAction.find({ user: userId });
  const dismissedTipIds = new Set(
    actions.filter((a) => a.action === 'dismissed').map((a) => a.tip.toString())
  );
  const pinnedTipIds = new Set(
    actions.filter((a) => a.action === 'pinned').map((a) => a.tip.toString())
  );

  // Re-generate current month rule-based tips
  const generatedTips = await evaluateSavingRules(userId, currentMonthStr);

  // Format & filter out dismissed tips
  const activeTips = generatedTips
    .filter((t) => !dismissedTipIds.has(t._id.toString()))
    .map((t) => {
      const obj = t.toObject ? t.toObject() : { ...t };
      obj.potentialSavings = toAmount(obj.potentialSavings);
      obj.isPinned = pinnedTipIds.has(t._id.toString());
      return obj;
    });

  // Rank by pinned first, then highest potential savings
  activeTips.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.potentialSavings - a.potentialSavings;
  });

  return activeTips;
};

/**
 * Evaluate deterministic tips rules and upsert them in database.
 */
const evaluateSavingRules = async (userId, monthStr) => {
  const user = await User.findById(userId);
  const startOfMonth = new Date(`${monthStr}-01T00:00:00.000Z`);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

  const tipsToEnsure = [];

  // RULE 1: Category spending > 120% of 3-month average
  const threeMonthsAgo = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 3, 1);
  const prevMonthEnd = new Date(startOfMonth.getTime() - 1);

  const currentSpendAgg = await Transaction.aggregate([
    {
      $match: {
        user: userObjId(userId),
        type: 'expense',
        deletedAt: null,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: '$category',
        totalCents: { $sum: '$amount' }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'cat'
      }
    },
    { $unwind: '$cat' }
  ]);

  const historySpendAgg = await Transaction.aggregate([
    {
      $match: {
        user: userObjId(userId),
        type: 'expense',
        deletedAt: null,
        date: { $gte: threeMonthsAgo, $lte: prevMonthEnd }
      }
    },
    {
      $group: {
        _id: '$category',
        avgCents: { $sum: { $divide: ['$amount', 3] } }
      }
    }
  ]);

  const historyMap = new Map();
  historySpendAgg.forEach((h) => historyMap.set(h._id.toString(), h.avgCents));

  for (const item of currentSpendAgg) {
    const avg = historyMap.get(item._id.toString()) || 0;
    if (avg > 0 && item.totalCents > 1.2 * avg) {
      const excessCents = Math.round(item.totalCents - avg);
      // Use admin template if available, else built-in fallback
      const text = await resolveTemplate('spending_spike', {
        category: item.cat.name,
        excess: formatMoney(toAmount(excessCents), user.currency),
      });
      tipsToEnsure.push({ ruleType: 'spending_spike', text, potentialSavings: excessCents });
    }
  }

  // RULE 2: Budget warning >= 80%
  const budgets = await Budget.find({ user: userId, month: monthStr }).populate('category');
  for (const item of currentSpendAgg) {
    const budget = budgets.find((b) => b.category._id.toString() === item._id.toString());
    if (budget && item.totalCents >= 0.8 * budget.limitAmount) {
      const remainingCents = Math.max(0, budget.limitAmount - item.totalCents);
      const text = await resolveTemplate('budget_warning', {
        category: budget.category.name,
        remaining: formatMoney(toAmount(remainingCents), user.currency),
      });
      tipsToEnsure.push({ ruleType: 'budget_warning', text, potentialSavings: remainingCents });
    }
  }

  // RULE 3: Savings Goal at Risk (Total expenses exceed monthly allowance baseline)
  const totalExpenseCents = currentSpendAgg.reduce((acc, curr) => acc + curr.totalCents, 0);
  if (user && user.monthlyAllowanceBaseline > 0 && totalExpenseCents > user.monthlyAllowanceBaseline) {
    const deficitCents = totalExpenseCents - user.monthlyAllowanceBaseline;
    const text = await resolveTemplate('savings_goal_at_risk', {
      deficit: formatMoney(toAmount(deficitCents), user.currency),
    });
    tipsToEnsure.push({ ruleType: 'savings_goal_at_risk', text, potentialSavings: deficitCents });
  }

  // Fallback tip if no rule triggered
  if (tipsToEnsure.length === 0) {
    tipsToEnsure.push({
      ruleType: 'spending_spike',
      text: 'Great budget tracking! Keep logging your daily meals and coffee runs to discover new saving opportunities.',
      potentialSavings: toCents(15)
    });
  }

  // Upsert tips in DB
  const savedTips = [];
  for (const t of tipsToEnsure) {
    let tipDoc = await Tip.findOne({ user: userId, ruleType: t.ruleType, month: monthStr, text: t.text });
    if (!tipDoc) {
      tipDoc = await Tip.create({
        user: userId,
        ruleType: t.ruleType,
        text: t.text,
        potentialSavings: t.potentialSavings,
        month: monthStr
      });
    }
    savedTips.push(tipDoc);
  }

  // Remove stale tips from this month that are no longer valid (e.g., budget was reduced)
  const savedIds = savedTips.map((t) => t._id);
  await Tip.deleteMany({ user: userId, month: monthStr, _id: { $nin: savedIds } });

  return savedTips;
};

/**
 * Pin or Dismiss a saving tip.
 */
export const setUserTipAction = async (userId, tipId, action) => {
  const tip = await Tip.findOne({ _id: tipId, user: userId });
  if (!tip) {
    const error = new Error('Saving tip not found');
    error.statusCode = 404;
    throw error;
  }

  await TipAction.findOneAndUpdate(
    { user: userId, tip: tipId },
    { action },
    { upsert: true, new: true }
  );

  return { message: `Tip marked as ${action}.` };
};

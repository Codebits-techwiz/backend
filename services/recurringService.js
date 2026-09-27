import { RecurringRule } from '../models/RecurringRule.js';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { toCents, toAmount } from '../utils/money.js';

export const formatRecurringRule = (rule) => {
  const obj = rule.toObject ? rule.toObject() : { ...rule };
  obj.amount = toAmount(obj.amount);
  return obj;
};

export const getRecurringRules = async (userId) => {
  const rules = await RecurringRule.find({ user: userId }).populate('category', 'name type icon color').sort({ createdAt: -1 });
  return rules.map(formatRecurringRule);
};

export const createRecurringRule = async (userId, data) => {
  const category = await Category.findOne({
    _id: data.category,
    $or: [{ isDefault: true }, { owner: userId }]
  });

  if (!category) {
    const error = new Error('Invalid category ID');
    error.statusCode = 400;
    throw error;
  }

  const nextDate = data.nextRunDate ? new Date(data.nextRunDate) : new Date();

  const rule = await RecurringRule.create({
    user: userId,
    category: data.category,
    type: data.type || category.type,
    amount: toCents(data.amount),
    description: data.description || '',
    frequency: data.frequency || 'monthly',
    nextRunDate: nextDate,
    isActive: data.isActive !== undefined ? data.isActive : true
  });

  const populated = await RecurringRule.findById(rule._id).populate('category', 'name type icon color');
  return formatRecurringRule(populated);
};

export const updateRecurringRule = async (userId, ruleId, updateData) => {
  const rule = await RecurringRule.findOne({ _id: ruleId, user: userId });
  if (!rule) {
    const error = new Error('Recurring rule not found');
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
    rule.category = updateData.category;
  }
  if (updateData.type) rule.type = updateData.type;
  if (updateData.amount !== undefined) rule.amount = toCents(updateData.amount);
  if (updateData.description !== undefined) rule.description = updateData.description;
  if (updateData.frequency) rule.frequency = updateData.frequency;
  if (updateData.nextRunDate) rule.nextRunDate = new Date(updateData.nextRunDate);
  if (updateData.isActive !== undefined) rule.isActive = updateData.isActive;

  await rule.save();
  const populated = await RecurringRule.findById(rule._id).populate('category', 'name type icon color');
  return formatRecurringRule(populated);
};

export const deleteRecurringRule = async (userId, ruleId) => {
  const rule = await RecurringRule.findOneAndDelete({ _id: ruleId, user: userId });
  if (!rule) {
    const error = new Error('Recurring rule not found');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Recurring rule deleted successfully.' };
};

/**
 * Process due recurring rules to automatically post transactions.
 * Business Rule: A node-cron job runs daily, creates due transactions, and advances nextRunDate.
 */
export const processDueRecurringRules = async () => {
  const now = new Date();
  const dueRules = await RecurringRule.find({
    isActive: true,
    nextRunDate: { $lte: now }
  });

  let createdCount = 0;

  for (const rule of dueRules) {
    // Post new transaction
    await Transaction.create({
      user: rule.user,
      category: rule.category,
      type: rule.type,
      amount: rule.amount,
      description: `[Auto-Recurring] ${rule.description}`.trim(),
      date: rule.nextRunDate,
      isRecurring: true,
      recurringRule: rule._id
    });

    // Advance next run date
    const nextDate = new Date(rule.nextRunDate);
    if (rule.frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (rule.frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    rule.nextRunDate = nextDate;
    await rule.save();
    createdCount++;
  }

  return createdCount;
};

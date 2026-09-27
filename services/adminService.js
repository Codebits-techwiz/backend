import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import Announcement from '../models/Announcement.js';
import { TipTemplate } from '../models/TipTemplate.js';
import { toAmount } from '../utils/money.js';

// ─── Platform Stats ───────────────────────────────────────────────────────────
export const getSystemStats = async () => {
  const activeUsers = await User.countDocuments({ role: 'student', isActive: true });

  // Total non-deleted transaction count
  const totalTransactions = await Transaction.countDocuments({ deletedAt: null });

  // Aggregate total income/expense volume — NO access to individual transactions
  const volumeResult = await Transaction.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$type', totalVolume: { $sum: '$amount' } } },
  ]);

  let totalIncomeCents = 0;
  let totalExpenseCents = 0;
  volumeResult.forEach((item) => {
    if (item._id === 'income') totalIncomeCents = item.totalVolume;
    if (item._id === 'expense') totalExpenseCents = item.totalVolume;
  });

  const topCategories = await Transaction.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
    { $unwind: '$categoryInfo' },
    { $project: { _id: 1, name: '$categoryInfo.name', count: 1 } },
  ]);

  return {
    activeUsers,
    totalTransactions,
    totalVolume: {
      income: toAmount(totalIncomeCents),
      expense: toAmount(totalExpenseCents)
    },
    topCategories
  };
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const getUsers = async () => {
  // Explicitly exclude all sensitive fields. Never fetch transactions.
  return User.find({ role: 'student' })
    .select('-passwordHash -resetTokenHash -resetTokenExpires')
    .sort({ createdAt: -1 });
};

export const updateUserStatus = async (userId, isActive) => {
  const user = await User.findById(userId);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }
  if (user.role === 'admin') { const e = new Error('Cannot change admin status'); e.statusCode = 403; throw e; }
  user.isActive = isActive;
  await user.save();
  return user;
};

/**
 * Admin password reset: generates a random 12-char temp password,
 * hashes it, saves to DB, and returns the PLAIN temp password once.
 * Hash is NEVER returned.
 */
export const resetStudentPassword = async (userId) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }
  if (user.role !== 'student') { const e = new Error('Can only reset student passwords'); e.statusCode = 403; throw e; }

  // Generate a random temporary password (letters + digits, 12 chars)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const tempPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  user.passwordHash = await bcrypt.hash(tempPassword, 10);
  await user.save();

  // Return plain temp password — the caller sends it in the response ONCE
  return { tempPassword, email: user.email };
};

// ─── System Categories ────────────────────────────────────────────────────────
export const createSystemCategory = async (data) => {
  const category = new Category({ ...data, owner: null, isDefault: true });
  await category.save();
  return category;
};

export const updateSystemCategory = async (categoryId, data) => {
  const category = await Category.findOne({ _id: categoryId, isDefault: true });
  if (!category) { const e = new Error('Default category not found'); e.statusCode = 404; throw e; }
  Object.assign(category, data);
  await category.save();
  return category;
};

/**
 * Delete a default system category.
 * RULE: Block if transactions reference it, UNLESS a reassignTo target is provided.
 */
export const deleteSystemCategory = async (categoryId, reassignTo) => {
  const category = await Category.findOne({ _id: categoryId, isDefault: true });
  if (!category) { const e = new Error('Default category not found'); e.statusCode = 404; throw e; }

  const usageCount = await Transaction.countDocuments({ category: categoryId, deletedAt: null });

  if (usageCount > 0 && !reassignTo) {
    const e = new Error(
      `Cannot delete: ${usageCount} transaction(s) reference this category. Provide a "reassignTo" category ID to migrate them.`
    );
    e.statusCode = 409;
    throw e;
  }

  if (usageCount > 0 && reassignTo) {
    const target = await Category.findById(reassignTo);
    if (!target) { const e = new Error('Reassign target category not found'); e.statusCode = 404; throw e; }
    // Move all transactions to the target category
    await Transaction.updateMany({ category: categoryId }, { $set: { category: reassignTo } });
  }

  await Category.findByIdAndDelete(categoryId);
  return { deletedId: categoryId, reassignedCount: usageCount };
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const createAnnouncement = async (adminId, data) => {
  const announcement = new Announcement({ ...data, createdBy: adminId });
  await announcement.save();
  return announcement;
};

export const getAnnouncements = async (isAdmin = false) => {
  const filter = isAdmin ? {} : { isActive: true };
  return Announcement.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'name');
};

export const updateAnnouncement = async (announcementId, data) => {
  const announcement = await Announcement.findByIdAndUpdate(announcementId, data, {
    new: true,
    runValidators: true,
  });
  if (!announcement) { const e = new Error('Announcement not found'); e.statusCode = 404; throw e; }
  return announcement;
};

export const deleteAnnouncement = async (announcementId) => {
  const announcement = await Announcement.findByIdAndDelete(announcementId);
  if (!announcement) { const e = new Error('Announcement not found'); e.statusCode = 404; throw e; }
};

// ─── Tip Templates ────────────────────────────────────────────────────────────
export const getTipTemplates = async () => TipTemplate.find().sort({ ruleType: 1, createdAt: -1 });

export const createTipTemplate = async (data) => TipTemplate.create(data);

export const updateTipTemplate = async (templateId, data) => {
  const t = await TipTemplate.findByIdAndUpdate(templateId, data, { new: true, runValidators: true });
  if (!t) { const e = new Error('Tip template not found'); e.statusCode = 404; throw e; }
  return t;
};

export const deleteTipTemplate = async (templateId) => {
  const t = await TipTemplate.findByIdAndDelete(templateId);
  if (!t) { const e = new Error('Tip template not found'); e.statusCode = 404; throw e; }
};

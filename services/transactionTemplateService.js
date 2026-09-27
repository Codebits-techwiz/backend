import TransactionTemplate from '../models/TransactionTemplate.js';
import { Category } from '../models/Category.js';

/**
 * TransactionTemplate Service (formerly bookmarkService)
 * Manages quick-entry transaction templates for students.
 */

export const getTemplates = async (userId) => {
  return TransactionTemplate.find({ user: userId })
    .populate('category', 'name icon color')
    .sort({ createdAt: -1 });
};

export const createTemplate = async (userId, data) => {
  const category = await Category.findOne({
    _id: data.category,
    $or: [{ isDefault: true }, { owner: userId }]
  });
  if (!category) {
    const error = new Error('Invalid category ID');
    error.statusCode = 400;
    throw error;
  }

  const template = new TransactionTemplate({ user: userId, ...data });
  await template.save();
  return template;
};

export const updateTemplate = async (userId, templateId, data) => {
  if (data.category) {
    const category = await Category.findOne({
      _id: data.category,
      $or: [{ isDefault: true }, { owner: userId }]
    });
    if (!category) {
      const error = new Error('Invalid category ID');
      error.statusCode = 400;
      throw error;
    }
  }

  const template = await TransactionTemplate.findOneAndUpdate(
    { _id: templateId, user: userId },
    data,
    { new: true, runValidators: true }
  );
  if (!template) {
    const err = new Error('Transaction template not found');
    err.statusCode = 404;
    throw err;
  }
  return template;
};

export const deleteTemplate = async (userId, templateId) => {
  const template = await TransactionTemplate.findOneAndDelete({ _id: templateId, user: userId });
  if (!template) {
    const err = new Error('Transaction template not found');
    err.statusCode = 404;
    throw err;
  }
};

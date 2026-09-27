import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';

/**
 * Category Service
 * Business logic layer for categories management.
 */

/**
 * Fetch all available categories for a student (System Defaults + Student's Own Custom Categories)
 */
export const getCategoriesForUser = async (userId) => {
  const categories = await Category.find({
    $or: [
      { isDefault: true },
      { owner: userId }
    ]
  }).sort({ isDefault: -1, name: 1 });

  return categories;
};

/**
 * Create a new custom category for a student user.
 */
export const createCustomCategory = async (userId, categoryData) => {
  // Check if a category with the same name already exists for this user or in defaults
  const existing = await Category.findOne({
    name: new RegExp(`^${categoryData.name.trim()}$`, 'i'),
    type: categoryData.type,
    $or: [{ isDefault: true }, { owner: userId }]
  });

  if (existing) {
    const error = new Error(`Category "${categoryData.name}" already exists`);
    error.statusCode = 409;
    throw error;
  }

  const newCategory = await Category.create({
    name: categoryData.name.trim(),
    type: categoryData.type,
    isDefault: false,
    owner: userId,
    icon: categoryData.icon || 'tag',
    color: categoryData.color || '#4F46E5'
  });

  return newCategory;
};

/**
 * Update user's custom category (Students CANNOT modify system default categories).
 */
export const updateCustomCategory = async (userId, categoryId, updateData) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  // Security check: Students cannot modify default categories or categories owned by others
  if (category.isDefault || (category.owner && category.owner.toString() !== userId)) {
    const error = new Error('Permission denied. System default categories cannot be modified.');
    error.statusCode = 403;
    throw error;
  }

  if (updateData.name) category.name = updateData.name.trim();
  if (updateData.type) category.type = updateData.type;
  if (updateData.icon) category.icon = updateData.icon;
  if (updateData.color) category.color = updateData.color;

  await category.save();
  return category;
};

/**
 * Delete a user's custom category.
 * Rule: Deleting a category that has transactions must be blocked or require a reassign target.
 */
export const deleteCustomCategory = async (userId, categoryId, reassignCategoryId = null) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  if (category.isDefault || (category.owner && category.owner.toString() !== userId)) {
    const error = new Error('Permission denied. System default categories cannot be deleted.');
    error.statusCode = 403;
    throw error;
  }

  // Check if active transactions exist for this category
  const activeTxCount = await Transaction.countDocuments({
    user: userId,
    category: categoryId,
    deletedAt: null
  });

  if (activeTxCount > 0) {
    // If reassign target is provided, transfer transactions first
    if (reassignCategoryId) {
      const targetCategory = await Category.findOne({
        _id: reassignCategoryId,
        $or: [{ isDefault: true }, { owner: userId }]
      });

      if (!targetCategory) {
        const error = new Error('Reassignment target category not found');
        error.statusCode = 400;
        throw error;
      }

      // Reassign transactions
      await Transaction.updateMany(
        { user: userId, category: categoryId, deletedAt: null },
        { category: reassignCategoryId }
      );
    } else {
      const error = new Error(
        `Cannot delete category "${category.name}" because it has ${activeTxCount} active transaction(s). Provide a reassignCategoryId to reassign them.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  await Category.findByIdAndDelete(categoryId);
  return { message: `Category "${category.name}" deleted successfully.` };
};

import * as categoryService from '../services/categoryService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategoriesForUser(req.user.id);
    return sendSuccess(res, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCustomCategory(req.user.id, req.body);
    return sendSuccess(res, 'Custom category created successfully', category, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const updated = await categoryService.updateCustomCategory(req.user.id, req.params.id, req.body);
    return sendSuccess(res, 'Category updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { reassignCategoryId } = req.query;
    const result = await categoryService.deleteCustomCategory(req.user.id, req.params.id, reassignCategoryId);
    return sendSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

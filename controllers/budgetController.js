import * as budgetService from '../services/budgetService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getBudgets = async (req, res, next) => {
  try {
    const { month } = req.query;
    const budgets = await budgetService.getBudgetsForMonth(req.user.id, month);
    return sendSuccess(res, 'Budgets retrieved successfully', budgets);
  } catch (error) {
    next(error);
  }
};

export const setBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.upsertBudget(req.user.id, req.body);
    return sendSuccess(res, 'Budget limit set successfully', budget, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const result = await budgetService.deleteBudget(req.user.id, req.params.id);
    return sendSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

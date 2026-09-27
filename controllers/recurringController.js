import * as recurringService from '../services/recurringService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getRecurringRules = async (req, res, next) => {
  try {
    const rules = await recurringService.getRecurringRules(req.user.id);
    return sendSuccess(res, 'Recurring rules retrieved successfully', rules);
  } catch (error) {
    next(error);
  }
};

export const createRecurringRule = async (req, res, next) => {
  try {
    const rule = await recurringService.createRecurringRule(req.user.id, req.body);
    return sendSuccess(res, 'Recurring rule created successfully', rule, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

export const updateRecurringRule = async (req, res, next) => {
  try {
    const updated = await recurringService.updateRecurringRule(req.user.id, req.params.id, req.body);
    return sendSuccess(res, 'Recurring rule updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteRecurringRule = async (req, res, next) => {
  try {
    const result = await recurringService.deleteRecurringRule(req.user.id, req.params.id);
    return sendSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

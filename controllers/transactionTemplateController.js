import * as templateService from '../services/transactionTemplateService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  type: z.enum(['income', 'expense']),
  description: z.string().optional().default(''),
});

export const getTemplates = async (req, res) => {
  try {
    const templates = await templateService.getTemplates(req.user.id);
    sendSuccess(res, 'Templates retrieved successfully', templates);
  } catch (err) {
    sendError(res, err.statusCode || 500, err.message);
  }
};

export const createTemplate = async (req, res) => {
  try {
    const data = templateSchema.parse(req.body);
    const template = await templateService.createTemplate(req.user.id, data);
    sendSuccess(res, 'Template created successfully', template, 201);
  } catch (err) {
    if (err.name === 'ZodError') return sendError(res, 400, 'Validation failed', err.errors);
    sendError(res, err.statusCode || 500, err.message);
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const data = templateSchema.partial().parse(req.body);
    const template = await templateService.updateTemplate(req.user.id, req.params.id, data);
    sendSuccess(res, 'Template updated successfully', template);
  } catch (err) {
    if (err.name === 'ZodError') return sendError(res, 400, 'Validation failed', err.errors);
    sendError(res, err.statusCode || 500, err.message);
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    await templateService.deleteTemplate(req.user.id, req.params.id);
    sendSuccess(res, 'Template deleted successfully');
  } catch (err) {
    sendError(res, err.statusCode || 404, err.message);
  }
};

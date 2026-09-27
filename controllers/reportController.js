import * as reportService from '../services/reportService.js';
import * as pdfService from '../services/pdfService.js';
import * as emailService from '../services/emailService.js';
import { sendSuccess } from '../utils/response.js';

export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const data = await reportService.getCategoryBreakdown(req.user.id, req.query);
    return sendSuccess(res, 'Category breakdown report retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getTrend6Months = async (req, res, next) => {
  try {
    const data = await reportService.getTrend6Months(req.user.id);
    return sendSuccess(res, '6-month trend report retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getDailyWeekly = async (req, res, next) => {
  try {
    const data = await reportService.getDailyWeeklySummaries(req.user.id, req.query);
    return sendSuccess(res, 'Daily/weekly report retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const exportPdf = async (req, res, next) => {
  try {
    await pdfService.generateReportPdfStream(req.user.id, res);
  } catch (error) {
    next(error);
  }
};

export const shareEmail = async (req, res, next) => {
  try {
    const result = await emailService.shareReportViaEmail(req.user.id, req.body.recipientEmail, req.body.month);
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

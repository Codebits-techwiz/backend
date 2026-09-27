import { parse } from 'csv-parse/sync';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { toCents, toAmount } from '../utils/money.js';
import { predictCategory } from './aiCategorizerService.js';
import { createTransactionSchema } from '../validators/transactionValidator.js';
import { checkAndDetectAnomaly } from './anomalyService.js';
import { checkAndTriggerBudgetAlert } from './budgetService.js';

/**
 * CSV Neutralizer
 * Security Rule: Neutralise CSV cells starting with =, +, -, @ to prevent Formula Injection vulnerability.
 */
const sanitizeCell = (val) => {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (['=', '+', '-', '@'].some((char) => trimmed.startsWith(char))) {
    return `'${trimmed}`;
  }
  return trimmed;
};

/**
 * Parse uploaded CSV buffer, validate rows, map categories, and return PREVIEW.
 * Limits: Max 1000 rows.
 */
export const previewCsvImport = async (userId, fileBuffer) => {
  const fileContent = fileBuffer.toString('utf-8');

  // Parse CSV
  let records = [];
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (parseError) {
    const error = new Error(`CSV parsing failed: ${parseError.message}`);
    error.statusCode = 400;
    throw error;
  }

  // Enforce 1000 rows max limit
  if (records.length > 1000) {
    const error = new Error('CSV exceeds maximum allowed limit of 1000 rows.');
    error.statusCode = 400;
    throw error;
  }

  if (records.length === 0) {
    const error = new Error('CSV file is empty.');
    error.statusCode = 400;
    throw error;
  }

  // Fetch all categories for user to auto-match category names
  const categories = await Category.find({
    $or: [{ isDefault: true }, { owner: userId }]
  });

  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(cat.name.toLowerCase(), cat);
  });

  const validRows = [];
  const errors = [];

  for (let index = 0; index < records.length; index++) {
    const row = records[index];
    const rowNum = index + 2; // Row number in original file (header is row 1)

    // Expected columns: date, type, amount, category, description
    const rawDate = row.date || row.Date;
    const rawType = (row.type || row.Type || 'expense').toLowerCase();
    const rawAmount = row.amount || row.Amount;
    const rawCategory = row.category || row.Category;
    const rawDescription = row.description || row.Description || '';

    // Validate required fields
    if (!rawAmount || isNaN(Number(rawAmount)) || Number(rawAmount) <= 0) {
      errors.push({ row: rowNum, message: 'Invalid or missing amount' });
      continue;
    }

    if (!['income', 'expense'].includes(rawType)) {
      errors.push({ row: rowNum, message: `Invalid type "${rawType}". Must be income or expense` });
      continue;
    }

    // Match Category
    let matchedCategory = null;
    let needsReview = false;
    if (rawCategory && categoryMap.has(rawCategory.toLowerCase())) {
      matchedCategory = categoryMap.get(rawCategory.toLowerCase());
    } else {
      // Unmatched: Call AI categorizer
      const textToAnalyze = rawDescription || rawCategory || 'unknown';
      const prediction = await predictCategory(userId, textToAnalyze);
      if (prediction.suggestedCategoryId && categoryMap.has(prediction.categoryName.toLowerCase())) {
        matchedCategory = categoryMap.get(prediction.categoryName.toLowerCase());
      } else {
        const fallbackName = rawType === 'income' ? 'other income' : 'miscellaneous';
        matchedCategory = categoryMap.get(fallbackName) || Array.from(categoryMap.values())[0];
      }
      needsReview = true;
    }

    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    if (isNaN(parsedDate.getTime())) {
      errors.push({ row: rowNum, message: `Invalid date format: ${rawDate}` });
      continue;
    }

    const sanitizedDescription = sanitizeCell(rawDescription);

    validRows.push({
      row: rowNum,
      date: parsedDate.toISOString(),
      type: rawType,
      amount: Number(rawAmount),
      amountCents: toCents(Number(rawAmount)),
      categoryId: matchedCategory._id.toString(),
      categoryName: matchedCategory.name,
      description: sanitizedDescription,
      needsReview
    });
  }

  return {
    totalRowsProcessed: records.length,
    validRowCount: validRows.length,
    errorCount: errors.length,
    errors,
    preview: validRows
  };
};

/**
 * Confirm and save validated CSV transaction preview.
 */
export const confirmCsvImport = async (userId, confirmedRows) => {
  if (!Array.isArray(confirmedRows) || confirmedRows.length === 0) {
    const error = new Error('No confirmed transaction rows provided to import.');
    error.statusCode = 400;
    throw error;
  }

  // Pre-fetch all valid categories for ownership checks
  const validCategories = await Category.find({
    $or: [{ isDefault: true }, { owner: userId }]
  });
  const validCategoryIds = new Set(validCategories.map((c) => c._id.toString()));

  const transactionsToCreate = [];
  
  for (const [index, row] of confirmedRows.entries()) {
    // 1. Zod Re-Validation
    const payload = {
      category: row.categoryId,
      type: row.type,
      amount: row.amount || (row.amountCents ? row.amountCents / 100 : 0),
      description: row.description || '',
      date: row.date
    };
    const parsed = createTransactionSchema.safeParse(payload);
    if (!parsed.success) {
      const error = new Error(`Validation failed on row ${index + 1}: ${parsed.error.errors[0].message}`);
      error.statusCode = 400;
      throw error;
    }

    // 2. Category Ownership Check
    if (!validCategoryIds.has(row.categoryId)) {
      const error = new Error(`Category ${row.categoryId} on row ${index + 1} is invalid or not owned by user.`);
      error.statusCode = 400;
      throw error;
    }

    const amountCents = row.amountCents || toCents(row.amount);
    const parsedDate = new Date(row.date);

    // 3. Anomaly Detection
    const anomaly = await checkAndDetectAnomaly(userId, row.categoryId, amountCents, parsedDate);

    transactionsToCreate.push({
      user: userId,
      category: row.categoryId,
      type: row.type,
      amount: amountCents,
      description: row.description || '',
      date: parsedDate,
      isFlagged: anomaly.isFlagged,
      flagReason: anomaly.flagReason
    });
  }

  const created = await Transaction.insertMany(transactionsToCreate);

  // 4. Fire budget alerts per imported expense row (non-blocking)
  for (const tx of created) {
    if (tx.type === 'expense') {
      checkAndTriggerBudgetAlert(userId, tx.category, tx.date).catch((err) => {
        console.error('[CSV Import Budget Alert Error]', err);
      });
    }
  }

  return {
    message: `Successfully imported ${created.length} transactions from CSV.`,
    importedCount: created.length
  };
};

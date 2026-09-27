import { Category } from '../models/Category.js';
import { predictCategory } from './aiCategorizerService.js';
import { GoogleGenAI } from '@google/genai';

/**
 * Receipt OCR Scanner Service
 * Parses uploaded receipt image/PDF buffer to extract total amount, merchant vendor, transaction date, and predicted category.
 */
export const scanReceiptFile = async (userId, file) => {
  if (!file || !file.buffer) {
    const err = new Error('Could not read receipt');
    err.statusCode = 422;
    throw err;
  }

  let extractedAmount = null;
  let merchantName = null;
  let receiptDate = new Date().toISOString().slice(0, 10);
  
  const apiKey = process.env.GEMINI_API_KEY;
  const isImage = file.mimetype && file.mimetype.startsWith('image/');

  if (isImage && apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analyze this receipt image. Return a JSON object with exactly these three keys:
1. "merchantName": The name of the store or vendor.
2. "amount": The total amount paid as a number (e.g. 25.50).
3. "date": The date on the receipt in YYYY-MM-DD format, or null if not found.`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: [
          prompt,
          { inlineData: { data: file.buffer.toString("base64"), mimeType: file.mimetype } }
        ]
      });

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.merchantName) merchantName = parsed.merchantName;
        if (parsed.amount) extractedAmount = parseFloat(parsed.amount);
        if (parsed.date) receiptDate = parsed.date;
      }
    } catch (err) {
      console.warn('[Receipt OCR] Gemini vision failed:', err);
    }
  }

  // Fallback heuristic for text files or if Gemini failed
  if (!extractedAmount || !merchantName) {
    const textContent = file.buffer.toString('utf-8');
    
    if (!extractedAmount) {
      const amountMatch = textContent.match(/(?:TOTAL|TOTAL DUE|AMOUNT|USD|\$)\s*:?\s*\$?\s*(\d+(?:\.\d{2})?)/i);
      if (amountMatch && amountMatch[1]) extractedAmount = parseFloat(amountMatch[1]);
    }
    
    if (!merchantName) {
      const vendorMatch = textContent.match(/MERCHANT:\s*([A-Za-z0-9\s]+)/i);
      if (vendorMatch && vendorMatch[1]) merchantName = vendorMatch[1].trim();
    }
  }

  // If we STILL don't have the required fields, fail instead of using mocks
  if (!extractedAmount || !merchantName) {
    const err = new Error('Could not read receipt');
    err.statusCode = 422;
    throw err;
  }

  // Predict Category using AI engine
  const prediction = await predictCategory(userId, merchantName);

  return {
    scanned: true,
    extractedData: {
      merchant: merchantName,
      amount: extractedAmount,
      date: receiptDate,
      type: 'expense',
      suggestedCategoryId: prediction.suggestedCategoryId,
      categoryName: prediction.categoryName,
      confidence: prediction.confidence
    }
  };
};

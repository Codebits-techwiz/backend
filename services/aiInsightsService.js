import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import { Insight } from '../models/Insight.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { toAmount } from '../utils/money.js';
import { formatMoney } from '../utils/currency.js';

const userObjId = (id) => new mongoose.Types.ObjectId(id);

/**
 * AI Monthly Spending Insights Service
 * Business Rule #3:
 * 1. Compute aggregate facts first (category totals, % change vs user's 3-month average).
 * 2. Pass facts to LLM (Google Gemini API) to write a short narrative summary & actionable tip.
 * 3. Fall back to text template if LLM fails or no API key is present.
 * 4. Cache result in `insights` collection.
 * 5. Always append disclaimer: "Suggestion, not certified financial advice".
 */
export const getMonthlyInsights = async (userId, monthStr = null, force = false) => {
  const targetMonth = monthStr || new Date().toISOString().slice(0, 7);

  // Check cached insight in DB unless force is true
  if (!force) {
    const cached = await Insight.findOne({ user: userId, month: targetMonth });
    if (cached) {
      return {
        ...cached.toObject(),
        disclaimer: 'Notice: This insight is an advisory suggestion generated based on your spending patterns, not certified financial advice.'
      };
    }
  }

  const user = await User.findById(userId);
  const currencyCode = user ? user.currency : 'USD';

  // STEP 1: Compute Aggregate Facts
  const startOfMonth = new Date(`${targetMonth}-01T00:00:00.000Z`);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

  // Current Month Category Expense Totals
  const currentMonthAgg = await Transaction.aggregate([
    {
      $match: {
        user: userObjId(userId),
        type: 'expense',
        deletedAt: null,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: '$category',
        totalCents: { $sum: '$amount' }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' }
  ]);

  // 3-Month Historical Average per Category
  const threeMonthsAgo = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 3, 1);
  const prevMonthEnd = new Date(startOfMonth.getTime() - 1);

  const historyAgg = await Transaction.aggregate([
    {
      $match: {
        user: userObjId(userId),
        type: 'expense',
        deletedAt: null,
        date: { $gte: threeMonthsAgo, $lte: prevMonthEnd }
      }
    },
    {
      $group: {
        _id: '$category',
        avgMonthlyCents: { $sum: { $divide: ['$amount', 3] } }
      }
    }
  ]);

  const historyMap = new Map();
  historyAgg.forEach((h) => historyMap.set(h._id.toString(), h.avgMonthlyCents));

  const facts = [];
  let highestSpikeCategory = null;
  let maxSpikePercentage = 0;

  currentMonthAgg.forEach((item) => {
    const catId = item._id.toString();
    const currentTotal = toAmount(item.totalCents);
    const avgTotal = toAmount(historyMap.get(catId) || item.totalCents);
    const pctChange = avgTotal > 0 ? Number((((currentTotal - avgTotal) / avgTotal) * 100).toFixed(1)) : 0;

    facts.push({
      category: item.category.name,
      currentSpent: currentTotal,
      historicalAverage: avgTotal,
      percentageChange: pctChange
    });

    if (pctChange > maxSpikePercentage) {
      maxSpikePercentage = pctChange;
      highestSpikeCategory = item.category.name;
    }
  });

  // STEP 2: Try Generating with Gemini LLM API if key is present
  let summaryText = '';
  let tipText = '';
  let source = 'template';

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a friendly student financial assistant for "Campus Coin". 
Analyze these monthly spending facts for a college student during ${targetMonth}:
${JSON.stringify(facts, null, 2)}

Provide a response in JSON format with two keys:
1. "summaryText": A 2-sentence plain-language narrative summarizing their spending trends (e.g. highlight any spike like food delivery rising).
2. "tipText": One specific, simple, actionable saving tip for the student.`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt
      });
      const responseText = response.text;

      // Extract JSON payload from Gemini response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summaryText = parsed.summaryText;
        tipText = parsed.tipText;
        source = 'llm';
      }
    } catch (llmError) {
      console.warn('[AI Insight LLM Fallback] Gemini API call failed:', llmError);
    }
  }

  // STEP 3: Fallback to Template Generator if LLM didn't run or failed
  if (!summaryText) {
    if (highestSpikeCategory && maxSpikePercentage > 15) {
      summaryText = `In ${targetMonth}, your spending in ${highestSpikeCategory} rose sharply by ${maxSpikePercentage.toFixed(0)}% compared to your 3-month average.`;
      tipText = `Try setting a weekly cap of ${formatMoney(25, currencyCode)} on ${highestSpikeCategory} to get your spending back on track.`;
    } else if (facts.length > 0) {
      summaryText = `In ${targetMonth}, your spending remained stable across your primary categories without major anomalies.`;
      tipText = `Keep up the good habit! Try allocating your extra savings into your monthly goal baseline.`;
    } else {
      summaryText = `No transactions recorded yet for ${targetMonth}. Log your daily expenses to unlock monthly insights.`;
      tipText = `Start logging your canteen and transport entries to see personalized trend summaries.`;
    }
    source = 'template';
  }

  // STEP 4: Save & Cache Insight in DB (upsert to handle forced regeneration)
  const newInsight = await Insight.findOneAndUpdate(
    { user: userId, month: targetMonth },
    { summaryText, tipText, source },
    { upsert: true, new: true }
  );

  return {
    ...newInsight.toObject(),
    disclaimer: 'Notice: This insight is an advisory suggestion generated based on your spending patterns, not certified financial advice.'
  };
};

/**
 * Fetch all historical insights for a user, sorted by month (newest first)
 */
export const getInsightsHistory = async (userId) => {
  const insights = await Insight.find({ user: userId }).sort({ month: -1 });
  return insights.map((insight) => ({
    ...insight.toObject(),
    disclaimer: 'Notice: This insight is an advisory suggestion generated based on your spending patterns, not certified financial advice.'
  }));
};

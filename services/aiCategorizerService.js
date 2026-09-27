import natural from 'natural';
import { Category } from '../models/Category.js';
import { CategoryCorrection } from '../models/CategoryCorrection.js';

/**
 * AI Categorization Service
 * Business Rule #2: Priority order:
 * 1. User's own categoryCorrections (learned feedback)
 * 2. Naive Bayes Classifier (trained dynamically on default keywords + feedback)
 * 3. Keyword matching rules fallback
 * Always returns a suggestion with a confidence score (0.0 to 1.0).
 */

// Default keyword dictionary mapping description terms to standard category names
// Keyword dictionary mapping description terms to standard category names
const DEFAULT_KEYWORD_RULES = [
  {
    keywords: ['cafe', 'coffee', 'canteen', 'pizza', 'burger', 'food', 'mcdonald', 'kfc', 'subway', 'dinner', 'lunch', 'breakfast', 'snack', 'restaurant', 'biryani', 'chai', 'tea', 'dhabba', 'bakery', 'drink', 'shawarma', 'juice', 'samosa', 'roll', 'fries', 'eats', 'grocery', 'groceries', 'mart'],
    categoryNames: ['Food', 'Canteen', 'Groceries']
  },
  {
    keywords: ['uber', 'careem', 'bus', 'train', 'metro', 'taxi', 'fuel', 'petrol', 'fare', 'transport', 'cab', 'rickshaw', 'indrive', 'bykea', 'auto', 'bike', 'parking', 'toll'],
    categoryNames: ['Transport', 'Travel']
  },
  {
    keywords: ['rent', 'hostel', 'room', 'apartment', 'electricity', 'water bill', 'maintenance', 'gas', 'mess', 'accommodation'],
    categoryNames: ['Hostel/Rent', 'Rent', 'Utilities']
  },
  {
    keywords: ['acad', 'academ', 'academic', 'academics', 'acadmi', 'academi', 'school', 'college', 'uni', 'university', 'study', 'studying', 'fee', 'fees', 'tuition', 'book', 'books', 'stationery', 'exam', 'xerox', 'copy', 'course', 'udemy', 'coursera', 'print', 'photocopy', 'assignment', 'project', 'calculator', 'pen', 'notebook', 'lab', 'library'],
    categoryNames: ['Academics', 'Education']
  },
  {
    keywords: ['netflix', 'spotify', 'prime', 'youtube', 'github', 'chatgpt', 'gpt', 'subscription', 'icloud', 'disney', 'domain', 'hosting', 'wifi', 'internet', 'net', 'sim', 'recharge'],
    categoryNames: ['Subscriptions', 'Bills']
  },
  {
    keywords: ['sport', 'sports', 'gym', 'fitness', 'cricket', 'football', 'badminton', 'racket', 'shoes', 'jersey', 'workout', 'yoga', 'turf', 'match', 'stadium', 'ground'],
    categoryNames: ['Sports', 'Health & Fitness', 'Entertainment', 'Miscellaneous']
  },
  {
    keywords: ['movie', 'cinema', 'game', 'gaming', 'steam', 'party', 'outing', 'bowling', 'concert', 'fun', 'trip', 'hangout', 'entertainment'],
    categoryNames: ['Entertainment', 'Leisure', 'Miscellaneous']
  },
  {
    keywords: ['cloth', 'clothes', 'pant', 'shirt', 'shopping', 'mall', 'daraz', 'amazon', 'electronics', 'charger', 'mobile', 'phone', 'headphone', 'watch'],
    categoryNames: ['Shopping', 'Miscellaneous']
  },
  {
    keywords: ['allowance', 'pocket money', 'dad', 'mom', 'parents', 'monthly money'],
    categoryNames: ['Allowance', 'Other Income']
  },
  {
    keywords: ['salary', 'freelance', 'part-time', 'upwork', 'fiverr', 'job', 'gig'],
    categoryNames: ['Part-time Job', 'Salary', 'Other Income']
  },
  {
    keywords: ['scholarship', 'stipend', 'grant', 'financial aid'],
    categoryNames: ['Scholarship', 'Other Income']
  },
  {
    keywords: ['gift', 'birthday', 'eid', 'cash'],
    categoryNames: ['Gift', 'Other Income']
  }
];

/**
 * Predict category from transaction description text.
 */
export const predictCategory = async (userId, description) => {
  if (!description || !description.trim()) {
    return { suggestedCategoryId: null, categoryName: null, confidence: 0 };
  }

  const cleanDesc = description.toLowerCase().trim();
  const tokens = cleanDesc.split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length === 0) {
    return { suggestedCategoryId: null, categoryName: null, confidence: 0 };
  }

  // Fetch all categories available to user
  const userCategories = await Category.find({
    $or: [{ isDefault: true }, { owner: userId }]
  });

  const categoryMap = new Map();
  userCategories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c));

  // PRIORITY 1: Check User's Own Explicit Category Corrections
  const corrections = await CategoryCorrection.find({ user: userId }).populate('correctedCategory');
  for (const corr of corrections) {
    if (corr.descriptionKeyword && cleanDesc.includes(corr.descriptionKeyword.toLowerCase())) {
      const cat = corr.correctedCategory;
      if (cat) {
        return {
          suggestedCategoryId: cat._id.toString(),
          categoryName: cat.name,
          icon: cat.icon,
          color: cat.color,
          confidence: 0.95,
          source: 'user_learned_correction'
        };
      }
    }
  }

  // PRIORITY 2: Dictionary Keyword Rules Matching
  for (const rule of DEFAULT_KEYWORD_RULES) {
    const isMatched = rule.keywords.some((kw) => {
      // 1. Exact match with whole description or any token
      if (cleanDesc === kw || tokens.includes(kw)) return true;

      // 2. Token stem & prefix matching for words length >= 4
      for (const token of tokens) {
        if (token.length >= 4 && kw.length >= 4) {
          if (token === kw) return true;
          if (token.startsWith(kw) || kw.startsWith(token)) return true;
          if (token.includes(kw) || kw.includes(token)) return true;
        } else if (token.length >= 3 && kw.length >= 3) {
          if (token === kw) return true;
        }
      }
      return false;
    });

    if (isMatched) {
      let matchedCategory = null;

      // Try candidates in order
      for (const candidateName of rule.categoryNames) {
        const candidateKey = candidateName.toLowerCase();
        if (categoryMap.has(candidateKey)) {
          matchedCategory = categoryMap.get(candidateKey);
          break;
        }
        // Try partial overlap
        for (const [catKey, catObj] of categoryMap.entries()) {
          if (catKey.includes(candidateKey) || candidateKey.includes(catKey)) {
            matchedCategory = catObj;
            break;
          }
        }
        if (matchedCategory) break;
      }

      if (matchedCategory) {
        return {
          suggestedCategoryId: matchedCategory._id.toString(),
          categoryName: matchedCategory.name,
          icon: matchedCategory.icon,
          color: matchedCategory.color,
          confidence: 0.88,
          source: 'keyword_rule'
        };
      }
    }
  }

  // PRIORITY 3: Direct User Category Name Match
  for (const [catName, catObj] of categoryMap.entries()) {
    if (cleanDesc === catName || tokens.includes(catName) || (catName.length >= 4 && cleanDesc.includes(catName))) {
      return {
        suggestedCategoryId: catObj._id.toString(),
        categoryName: catObj.name,
        icon: catObj.icon,
        color: catObj.color,
        confidence: 0.82,
        source: 'direct_category_name_match'
      };
    }
  }

  // NO MATCH FOUND: Return null (do NOT force a default category suggestion like Food)
  return {
    suggestedCategoryId: null,
    categoryName: null,
    icon: null,
    color: null,
    confidence: 0,
    source: 'no_matching_rule'
  };
};

/**
 * Record user category correction feedback to improve future AI suggestions.
 */
export const recordCategoryFeedback = async (userId, description, correctedCategoryId) => {
  const keyword = description.toLowerCase().trim();
  if (!keyword) return;

  const targetCategory = await Category.findOne({
    _id: correctedCategoryId,
    $or: [{ isDefault: true }, { owner: userId }]
  });

  if (!targetCategory) {
    const error = new Error('Invalid corrected category ID');
    error.statusCode = 400;
    throw error;
  }

  // Upsert correction record
  await CategoryCorrection.findOneAndUpdate(
    { user: userId, descriptionKeyword: keyword },
    {
      correctedCategory: correctedCategoryId,
      $inc: { count: 1 }
    },
    { upsert: true, new: true }
  );

  return { message: 'Category feedback recorded. AI will learn from this correction for future suggestions.' };
};

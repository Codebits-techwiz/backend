import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from '../models/Category.js';
dotenv.config();

const emojiToKey = {
  '💰': 'piggy-bank',
  '💼': 'briefcase',
  '🎓': 'graduation-cap',
  '🎁': 'gift',
  '💵': 'wallet',
  '🍔': 'utensils',
  '🚌': 'car',
  '🏠': 'home',
  '📚': 'book-open',
  '📱': 'smartphone',
  '🎮': 'gamepad-2',
  '📦': 'tag',
  '🏷️': 'tag',
  '📁': 'tag', // default fallback
};

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB for migration');
    const categories = await Category.find({});
    let updated = 0;
    
    for (const c of categories) {
      if (emojiToKey[c.icon]) {
        c.icon = emojiToKey[c.icon];
      } else if (!c.icon || c.icon.length > 20 || c.icon.includes(' ')) {
        c.icon = 'tag'; // fallback for weird old entries
      }
      
      // If the icon is already a valid string like "car", it will remain unchanged
      
      await c.save();
      updated++;
    }
    
    console.log(`Migrated ${updated} categories.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

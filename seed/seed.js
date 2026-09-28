import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import Announcement from '../models/Announcement.js';
import { Budget } from '../models/Budget.js';
import { RecurringRule } from '../models/RecurringRule.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Bookmark } from '../models/Bookmark.js';
import { Tip } from '../models/Tip.js';
import { TipAction } from '../models/TipAction.js';
import { TipTemplate } from '../models/TipTemplate.js';
import { Insight } from '../models/Insight.js';
import { CategoryCorrection } from '../models/CategoryCorrection.js';
import TransactionTemplate from '../models/TransactionTemplate.js';

import { SiteContent } from '../models/SiteContent.js';
import { DEFAULT_SITE_CONTENT } from '../services/siteContentService.js';
import { DEFAULT_CATEGORIES } from '../config/defaultCategories.js';
import { toYearMonthLocal } from '../utils/money.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuscoin';

// Deterministic random number generator for repeatable seeded data
let seed = 123456789;
const random = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};
const randomInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[randomInt(0, arr.length - 1)];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear ALL collections
    await User.deleteMany({});
    await Category.deleteMany({});
    await Transaction.deleteMany({});
    await Announcement.deleteMany({});
    await Budget.deleteMany({});
    await RecurringRule.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    await Bookmark.deleteMany({});
    await Tip.deleteMany({});
    await TipAction.deleteMany({});
    await TipTemplate.deleteMany({});
    await Insight.deleteMany({});
    await CategoryCorrection.deleteMany({});
    await TransactionTemplate.deleteMany({});
    await SiteContent.deleteMany({});

    console.log('Cleared all collections.');

    // Seed SiteContent default sections
    for (const [sectionKey, sectionData] of Object.entries(DEFAULT_SITE_CONTENT)) {
      await SiteContent.create({ section: sectionKey, data: sectionData });
    }
    console.log('Seeded SiteContent sections (hero, stats, testimonials, faqs).');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@campuscoin.com',
      passwordHash,
      role: 'admin',
      academicYear: 'Graduate',
    });

    // Create 3 Student Users
    const students = await User.insertMany([
      {
        name: 'John Doe',
        email: 'student@campuscoin.com',
        passwordHash,
        role: 'student',
        academicYear: 'Year 2',
        monthlyAllowanceBaseline: 150000,
        monthlySavingsGoal: 20000,
        currency: 'PKR',
      },
      {
        name: 'Jane Smith',
        email: 'jane@campuscoin.com',
        passwordHash,
        role: 'student',
        academicYear: 'Year 1',
        monthlyAllowanceBaseline: 120000,
        monthlySavingsGoal: 10000,
      },
      {
        name: 'Bob Johnson',
        email: 'bob@campuscoin.com',
        passwordHash,
        role: 'student',
        academicYear: 'Year 4',
        monthlyAllowanceBaseline: 200000,
        monthlySavingsGoal: 50000,
      }
    ]);

    const primaryStudent = students[0];

    // Seed all SRS default categories
    const insertedCategories = await Category.insertMany(DEFAULT_CATEGORIES);
    
    const getCat = (name) => insertedCategories.find(c => c.name === name);

    // Create 6 Months of Transactions for primary student
    const transactions = [];
    const now = new Date();
    const currentMonthStr = toYearMonthLocal(now);

    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const monthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthOffset, 15));
      
      // Fixed income
      transactions.push({
        user: primaryStudent._id,
        category: getCat('Allowance')._id,
        type: 'income',
        amount: 150000,
        date: new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthOffset, 1)),
        description: 'Monthly Allowance',
      });

      // Fixed rent
      transactions.push({
        user: primaryStudent._id,
        category: getCat('Hostel/Rent')._id,
        type: 'expense',
        amount: 50000, // $500
        date: new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthOffset, 5)),
        description: 'Hostel Rent',
      });

      // Random other expenses (Transport, Academics, Entertainment, Subscriptions)
      const expenseCats = ['Transport', 'Academics', 'Entertainment', 'Subscriptions', 'Food'];
      
      const maxDay = monthOffset === 0 ? Math.min(28, now.getUTCDate()) : 28;

      for (let i = 0; i < 20; i++) {
        const randomDay = randomInt(1, maxDay);
        const randomAmount = randomInt(500, 2500); // $5 to $25
        const randomCat = getCat(randomElement(expenseCats));

        transactions.push({
          user: primaryStudent._id,
          category: randomCat._id,
          type: 'expense',
          amount: randomAmount,
          date: new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthOffset, randomDay)),
          description: `Random expense ${i}`,
        });
      }

      // Deliberate Food spike in the latest month
      if (monthOffset === 0) {
        for (let i = 0; i < 15; i++) {
          transactions.push({
            user: primaryStudent._id,
            category: getCat('Food')._id,
            type: 'expense',
            amount: randomInt(3000, 5000), // $30 to $50
            date: new Date(Date.UTC(now.getFullYear(), now.getMonth(), randomInt(1, maxDay))),
            description: `Extra food spike ${i}`,
          });
        }
      }
    }

    await Transaction.insertMany(transactions);

    // Budgets for primary student in current month
    // One near 80% (e.g. Transport)
    // One over 100% (e.g. Food - it will be over 100% because of the spike)
    await Budget.create({
      user: primaryStudent._id,
      category: getCat('Transport')._id,
      month: currentMonthStr,
      limitAmount: 5000, // $50 limit, should be close to actual spending based on random
    });
    
    await Budget.create({
      user: primaryStudent._id,
      category: getCat('Food')._id,
      month: currentMonthStr,
      limitAmount: 20000, // $200 limit (the spike alone adds $450-750)
    });

    // Recurring Rules
    await RecurringRule.create({
      user: primaryStudent._id,
      category: getCat('Subscriptions')._id,
      type: 'expense',
      amount: 1599, // $15.99
      description: 'Netflix',
      frequency: 'monthly',
      nextRunDate: new Date(now.getFullYear(), now.getMonth(), 20),
      isActive: true
    });

    // Create Announcement
    await Announcement.create({
      title: 'Welcome to Campus Coin!',
      message: 'Track your expenses easily and stay on budget.',
      isActive: true,
      createdBy: admin._id
    });

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

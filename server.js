import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, chatLimiter } from './middleware/rateLimiter.js';
import { uploadsRoot } from './middleware/upload.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import recurringRoutes from './routes/recurringRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import transactionTemplateRoutes from './routes/transactionTemplateRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import siteContentRoutes from './routes/siteContentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { initRecurringCronJob } from './jobs/recurringCron.js';
import { ensureDefaultCategories } from './services/categoryService.js';
import { migrateLegacyUserMoney } from './services/migrateLegacyMoney.js';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

// Load environment variables first — guard runs immediately after
dotenv.config();

// Refuse to start without a real JWT_SECRET — prevents accidental insecure deployment
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is not set. Set it in your .env file and restart.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security & Utility Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and local IP network access (dev mode convenience)
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://192.168.') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(null, process.env.CLIENT_URL || 'http://localhost:3000');
      }
    },
    credentials: true // Allow httpOnly cookies
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsRoot));

// Sanitize inputs against NoSQL injection
app.use(mongoSanitize());

// Global API rate limiter (100 req / 15 min by default, tune via API_RATE_LIMIT_MAX)
app.use('/api', apiLimiter);

import mongoose from 'mongoose';

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'online',
    database: dbStatus,
    app: 'Campus Coin Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/templates', transactionTemplateRoutes); // Quick-entry transaction templates (extra feature)
app.use('/api/activity', activityRoutes);             // Recently viewed/created/edited transactions
app.use('/api/site-content', siteContentRoutes);      // Public landing page editable content
app.use('/api/chat', chatLimiter, chatRoutes);             // Public AI chatbot assistant

// Initialize node-cron automated recurring rules job
initRecurringCronJob();

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found on this server`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Connect Database & Start Server
connectDB().then(async () => {
  try {
    await ensureDefaultCategories();
  } catch (err) {
    console.error('[Categories] Failed to ensure built-in defaults:', err.message);
  }

  try {
    const fixed = await migrateLegacyUserMoney();
    if (fixed > 0) {
      console.log(`[Migrate] Fixed legacy allowance/savings cents for ${fixed} user(s).`);
    }
  } catch (err) {
    console.error('[Migrate] Legacy money migration failed:', err.message);
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `[Campus Coin API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  }
});


export default app;

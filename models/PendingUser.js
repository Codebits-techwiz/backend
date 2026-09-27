import mongoose from 'mongoose';

/**
 * PendingUser Schema
 * Stores unverified registration details temporarily.
 * Auto-expires in 10 minutes (600 seconds) via TTL index on createdAt.
 */
const pendingUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    academicYear: {
      type: String,
      default: '1st Year',
      trim: true
    },
    monthlyAllowanceBaseline: {
      type: Number,
      default: 0
    },
    monthlySavingsGoal: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'PKR'
    },
    otpCode: {
      type: String,
      required: [true, 'OTP code is required']
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600 // Auto-delete document from DB after 10 minutes (600s)
    }
  }
);

export const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

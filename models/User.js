import mongoose from 'mongoose';
import { ROLES, CURRENCIES } from '../config/constants.js';

/**
 * User Mongoose Schema
 * Collection: users
 * Index: email (unique)
 * Note: Password hash and reset tokens are excluded from default query results for security.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Never return password hash unless explicitly requested (.select('+passwordHash'))
    },
    role: {
      type: String,
      enum: [ROLES.STUDENT, ROLES.ADMIN],
      default: ROLES.STUDENT
    },
    academicYear: {
      type: String,
      default: '1st Year',
      trim: true
    },
    // Money fields stored as INTEGER cents
    monthlyAllowanceBaseline: {
      type: Number,
      default: 0,
      min: [0, 'Allowance cannot be negative']
    },
    monthlySavingsGoal: {
      type: Number,
      default: 0,
      min: [0, 'Savings goal cannot be negative']
    },
    currency: {
      type: String,
      enum: Object.values(CURRENCIES),
      default: CURRENCIES.PKR
    },
    avatar: {
      type: String,
      default: null,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    loginOtpCode: {
      type: String,
      select: false
    },
    loginOtpExpires: {
      type: Date,
      select: false
    },
    resetOtpCode: {
      type: String,
      select: false
    },
    resetOtpExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.resetOtpCode;
        delete ret.resetOtpExpires;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const User = mongoose.model('User', userSchema);

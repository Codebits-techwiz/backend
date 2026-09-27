import mongoose from 'mongoose';

/**
 * TipTemplate Mongoose Schema
 * Collection: tiptemplates
 * Admin-managed text templates for each rule type.
 * The tips engine uses active templates; falls back to built-in strings if none exist.
 */
const tipTemplateSchema = new mongoose.Schema(
  {
    // Which rule this template belongs to
    ruleType: {
      type: String,
      enum: ['spending_spike', 'budget_warning', 'savings_goal_at_risk'],
      required: true,
    },
    // Template string. Use {category}, {excess}, {remaining}, {deficit} as placeholders.
    template: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const TipTemplate = mongoose.model('TipTemplate', tipTemplateSchema);

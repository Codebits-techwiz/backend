import mongoose from 'mongoose';

/**
 * SiteContent Mongoose Schema
 * Collection: sitecontents
 * Stores editable text, stats, testimonials, and FAQs for the public landing page.
 */
const siteContentSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const SiteContent = mongoose.model('SiteContent', siteContentSchema);

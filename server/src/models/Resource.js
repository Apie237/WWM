import mongoose, { Schema } from 'mongoose';
import { slugify } from '../utils/slugify.js';
import { CONTENT_STATUSES, RESOURCE_TYPES } from './enums.js';

// Resource-library entry (sermon, devotional, tract, download…). `url` is an
// external http(s) link; hosted file uploads/Document model are Phase 9.
const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 220 },
    description: { type: String, trim: true, maxlength: 2000 },
    resourceType: { type: String, enum: RESOURCE_TYPES, default: 'other' },
    url: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    publishedAt: { type: Date },
    order: { type: Number, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

resourceSchema.pre('validate', function prepare() {
  if (!this.slug && this.title) this.slug = slugify(this.title);
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
});

resourceSchema.index({ status: 1, resourceType: 1, order: 1 });

export default mongoose.models.Resource || mongoose.model('Resource', resourceSchema);

import mongoose, { Schema } from 'mongoose';
import { slugify } from '../utils/slugify.js';
import { CONTENT_STATUSES } from './enums.js';

// News article. `country` is optional: unset means international news.
// Images are plain URL strings until Phase 9 (Cloudinary) — no upload logic.
const newsSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 220 },
    summary: { type: String, trim: true, maxlength: 500 },
    body: { type: String, trim: true, maxlength: 20000 },
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    imageUrl: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    publishedAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

newsSchema.pre('validate', function prepare() {
  if (!this.slug && this.title) this.slug = slugify(this.title);
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
});

newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ country: 1 });

export default mongoose.models.News || mongoose.model('News', newsSchema);

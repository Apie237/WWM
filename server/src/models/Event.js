import mongoose, { Schema } from 'mongoose';
import { slugify } from '../utils/slugify.js';
import { CONTENT_STATUSES } from './enums.js';

// Public event. `country` optional (unset = international event).
const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 220 },
    description: { type: String, trim: true, maxlength: 10000 },
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    location: { type: String, trim: true, maxlength: 300 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    imageUrl: { type: String, trim: true, maxlength: 500 },
    // Cloudinary asset id when the image was uploaded through the CMS (Phase 9);
    // unset for a legacy externally-hosted URL. Never accepted raw from clients — see mediaService.
    imagePublicId: { type: String, trim: true, maxlength: 120 },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

eventSchema.pre('validate', function prepare() {
  if (!this.slug && this.title) this.slug = slugify(this.title);
});

eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ country: 1 });

eventSchema.index({ imagePublicId: 1 }, { sparse: true });

export default mongoose.models.Event || mongoose.model('Event', eventSchema);

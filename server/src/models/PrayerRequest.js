import mongoose, { Schema } from 'mongoose';
import { PRAYER_REQUEST_STATUSES } from './enums.js';

// Public-submitted prayer request. Always created `pending`; only a
// moderator can set `approved`, and only approved requests are ever public.
// `name` is stored for moderators but shown publicly only when `showName`.
const prayerRequestSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 100 },
    showName: { type: Boolean, default: false },
    request: { type: String, required: true, trim: true, maxlength: 2000 },
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    status: { type: String, enum: PRAYER_REQUEST_STATUSES, default: 'pending' },
    moderationNote: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

prayerRequestSchema.index({ status: 1, createdAt: -1 });
prayerRequestSchema.index({ country: 1 });

export default mongoose.models.PrayerRequest || mongoose.model('PrayerRequest', prayerRequestSchema);

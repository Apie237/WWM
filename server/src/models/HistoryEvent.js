import mongoose, { Schema } from 'mongoose';
import { CONTENT_STATUSES, HISTORY_SECTIONS, HISTORY_ENTRY_TYPES, HISTORY_REVIEW_STATUSES } from './enums.js';

// Structured history (docs/PROJECT_SPEC.md §6 and §12: "History is represented
// as structured data, never hardcoded into React components"). One model feeds
// the global History page and, via `country`, any country's mission history.
//
// Uncertainty is preserved, not resolved: `year` is only a sort/anchor value;
// what visitors see is `dateLabel` (free text such as "1960s" or "1985–2021")
// plus `approximateDate`. `source` is the PUBLIC attribution line (e.g.
// "Founder-supplied notes"). `reviewStatus`, `reviewNote` and `notes` are
// PRIVATE editorial fields and are stripped by the public API.
const historyEventSchema = new Schema(
  {
    // Stable identifier used only by the seed script so it can be re-run safely.
    key: { type: String, trim: true, lowercase: true, maxlength: 80, unique: true, sparse: true },
    section: { type: String, enum: HISTORY_SECTIONS, required: true },
    entryType: { type: String, enum: HISTORY_ENTRY_TYPES, default: 'event' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    year: { type: Number, min: 0, max: 2200, validate: { validator: Number.isInteger, message: '"year" must be a whole number.' } },
    dateLabel: { type: String, trim: true, maxlength: 80 },
    approximateDate: { type: Boolean, default: false },
    historical: { type: Boolean, default: true },
    location: { type: String, trim: true, maxlength: 200 },
    people: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    source: { type: String, trim: true, maxlength: 500 },
    imageUrl: { type: String, trim: true, maxlength: 500 },
    // Cloudinary asset id when uploaded through the CMS (Phase 9 pattern).
    imagePublicId: { type: String, trim: true, maxlength: 120 },
    imageAlt: { type: String, trim: true, maxlength: 300 },
    imageCaption: { type: String, trim: true, maxlength: 300 },
    order: { type: Number, default: 0 },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    // ---- private editorial fields ----
    reviewStatus: { type: String, enum: HISTORY_REVIEW_STATUSES, default: 'unreviewed' },
    reviewNote: { type: String, trim: true, maxlength: 1000 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

historyEventSchema.index({ status: 1, section: 1, order: 1 });
historyEventSchema.index({ country: 1 });
historyEventSchema.index({ people: 1 });
historyEventSchema.index({ imagePublicId: 1 }, { sparse: true });

export default mongoose.models.HistoryEvent || mongoose.model('HistoryEvent', historyEventSchema);

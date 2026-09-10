import mongoose, { Schema } from 'mongoose';
import { slugify } from '../utils/slugify.js';
import { MINISTRY_TYPES } from './enums.js';

// Represents mission ministries/programs without a separate model per
// ministry type (docs/PROJECT_SPEC.md §6 core models list). `country` and
// `organization` are both optional because a ministry may be international in
// scope (e.g. Media & Publications) rather than tied to one country or
// institution.
const responsiblePersonSchema = new Schema(
  {
    person: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
    role: { type: String, trim: true, maxlength: 150 },
  },
  { _id: false }
);

const ministrySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 220 },
    description: { type: String, trim: true, maxlength: 5000 },
    ministryType: { type: String, enum: MINISTRY_TYPES, default: 'other' },
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    responsiblePeople: [responsiblePersonSchema],
    isActive: { type: Boolean, default: true },
    historical: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

ministrySchema.pre('validate', function generateSlug() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

ministrySchema.index({ country: 1 });
ministrySchema.index({ organization: 1 });
ministrySchema.index({ isActive: 1 });

export default mongoose.models.Ministry || mongoose.model('Ministry', ministrySchema);

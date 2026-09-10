import mongoose, { Schema } from 'mongoose';
import { slugify } from '../utils/slugify.js';
import { looseDateSchema } from './shared/looseDate.schema.js';
import { ORGANIZATION_TYPES } from './enums.js';

// ONE generic Organization model for churches and non-church institutions
// alike (docs/PROJECT_SPEC.md §6 rule 4, §8) — no separate Church/School/
// Hospital/Clinic/Orphanage/BibleCollege models. `type` distinguishes the
// category, matching PROJECT_SPEC.md §6 rule 5 exactly.
const leaderSchema = new Schema(
  {
    person: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
    role: { type: String, trim: true, maxlength: 150 },
  },
  { _id: false }
);

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 220 },
    type: { type: String, enum: ORGANIZATION_TYPES, required: true },
    description: { type: String, trim: true, maxlength: 5000 },
    // Organizations reference Country rather than duplicating country data
    // (docs/PROJECT_SPEC.md §8, "Relationship Requirements" — Continent →
    // Country → Organization).
    country: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
    location: {
      region: { type: String, trim: true, maxlength: 150 },
      city: { type: String, trim: true, maxlength: 150 },
      address: { type: String, trim: true, maxlength: 500 },
    },
    contact: {
      phone: { type: String, trim: true, maxlength: 50 },
      email: { type: String, trim: true, lowercase: true, maxlength: 200 },
      website: { type: String, trim: true, maxlength: 300 },
    },
    leaders: [leaderSchema],
    established: looseDateSchema,
    isActive: { type: Boolean, default: true },
    historical: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

organizationSchema.pre('validate', function generateSlug() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

// Supports the required future queries: all organizations of a type, all
// organizations in a country, and the combination of both (e.g. "all schools
// in Cameroon").
organizationSchema.index({ country: 1 });
organizationSchema.index({ type: 1 });
organizationSchema.index({ country: 1, type: 1 });
organizationSchema.index({ isActive: 1 });

export default mongoose.models.Organization || mongoose.model('Organization', organizationSchema);

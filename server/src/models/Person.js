import mongoose, { Schema } from 'mongoose';
import { slugify } from '../utils/slugify.js';
import { looseDateSchema } from './shared/looseDate.schema.js';
import { PERSON_ROLE_TYPES } from './enums.js';

// ONE Person model for everyone in the organization, historical or current
// (docs/PROJECT_SPEC.md §6 rule 2, §7). No separate Pastor/Missionary/
// Superintendent/Founder/BoardMember models exist — a person's involvement is
// expressed as one or more entries in `roles`, each carrying its own country/
// organization link, tenure dates, and current/historical status, so a single
// person (e.g. a Superintendent who is also a Missionary) can hold multiple
// roles at once without duplicating their record.
const roleSchema = new Schema(
  {
    roleType: { type: String, enum: PERSON_ROLE_TYPES, required: true },
    // Free-text position title (e.g. "General Secretary") for cases the
    // broad roleType enum doesn't capture precisely on its own.
    title: { type: String, trim: true, maxlength: 150 },
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    start: looseDateSchema,
    end: looseDateSchema,
    current: { type: Boolean, default: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const personSchema = new Schema(
  {
    // Required primary rendering field — many historical figures (e.g. "Rev.
    // Bearl D. Smalldridge") don't decompose cleanly into first/last alone,
    // so displayName is authoritative and the structured `name` fields below
    // are optional detail for search/sort, not the source of truth.
    displayName: { type: String, required: true, trim: true, maxlength: 200 },
    name: {
      prefix: { type: String, trim: true, maxlength: 20 },
      first: { type: String, trim: true, maxlength: 100 },
      middle: { type: String, trim: true, maxlength: 100 },
      last: { type: String, trim: true, maxlength: 100 },
      suffix: { type: String, trim: true, maxlength: 20 },
    },
    // Optional (not required/forced unique-non-null) — PROJECT_SPEC.md does
    // not mandate individual person bio pages, but DESIGN_SPEC.md's PersonCard
    // allows an optional bio link, so a slug is generated when possible
    // without requiring one.
    slug: { type: String, trim: true, lowercase: true, maxlength: 220 },
    biography: { type: String, trim: true, maxlength: 6000 },
    photoUrl: { type: String, trim: true, maxlength: 500 },
    lifeDates: {
      born: looseDateSchema,
      died: looseDateSchema,
    },
    roles: [roleSchema],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

personSchema.pre('validate', function generateSlug() {
  if (!this.slug && this.displayName) {
    this.slug = slugify(this.displayName);
  }
});

personSchema.index({ slug: 1 }, { unique: true, sparse: true });
personSchema.index({ 'roles.roleType': 1 });
personSchema.index({ 'roles.country': 1 });
personSchema.index({ 'roles.organization': 1 });
personSchema.index({ isActive: 1 });

export default mongoose.models.Person || mongoose.model('Person', personSchema);

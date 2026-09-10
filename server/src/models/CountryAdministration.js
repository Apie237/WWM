import mongoose, { Schema } from 'mongoose';
import { looseDateSchema } from './shared/looseDate.schema.js';
import { hierarchyEntrySchema } from './shared/hierarchyEntry.schema.js';

// CountryAdministration is its own model, separate from Country
// (docs/PROJECT_SPEC.md §6 rule 6, §10). It represents one leadership
// structure "snapshot" for a country. `positions` is a flat, data-driven
// array using the shared hierarchyEntrySchema (title/person/parentEntry/
// order/current/dates/notes) — no position names, tier counts, or reporting
// lines are hardcoded here or in any React component; the frontend
// reconstructs the org-chart tree from `parentEntry` pointers at render time
// (see docs/DESIGN_SPEC.md §6).
//
// Multiple documents per country are allowed (each `current: false` one is a
// preserved historical structure), but at most one `current: true` document
// per country is enforced at the database level via the partial unique index
// below — this is how "current vs. historical" leadership is distinguished
// per docs/PROJECT_SPEC.md §12 without overwriting past structures.
const countryAdministrationSchema = new Schema(
  {
    country: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
    positions: [hierarchyEntrySchema],
    current: { type: Boolean, default: true },
    historical: { type: Boolean, default: false },
    effectiveFrom: looseDateSchema,
    effectiveTo: looseDateSchema,
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

countryAdministrationSchema.index({ country: 1 });
countryAdministrationSchema.index(
  { country: 1, current: 1 },
  { unique: true, partialFilterExpression: { current: true } }
);
countryAdministrationSchema.index({ 'positions.person': 1 });

export default mongoose.models.CountryAdministration ||
  mongoose.model('CountryAdministration', countryAdministrationSchema);

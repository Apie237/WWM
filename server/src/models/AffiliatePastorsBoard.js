import mongoose, { Schema } from 'mongoose';
import { looseDateSchema } from './shared/looseDate.schema.js';
import { hierarchyEntrySchema } from './shared/hierarchyEntry.schema.js';

// AffiliatePastorsBoard is its own model, separate from Person and
// CountryAdministration (docs/PROJECT_SPEC.md §6 rule 7, §11). It follows the
// same generic, data-driven hierarchy pattern as CountryAdministration —
// reusing hierarchyEntrySchema so both org-chart-style structures share one
// definition — with `members` in place of `positions` to match the
// vocabulary docs/PROJECT_SPEC.md §11 uses for this board.
const affiliatePastorsBoardSchema = new Schema(
  {
    country: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
    members: [hierarchyEntrySchema],
    current: { type: Boolean, default: true },
    historical: { type: Boolean, default: false },
    effectiveFrom: looseDateSchema,
    effectiveTo: looseDateSchema,
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

affiliatePastorsBoardSchema.index({ country: 1 });
affiliatePastorsBoardSchema.index(
  { country: 1, current: 1 },
  { unique: true, partialFilterExpression: { current: true } }
);
affiliatePastorsBoardSchema.index({ 'members.person': 1 });

export default mongoose.models.AffiliatePastorsBoard ||
  mongoose.model('AffiliatePastorsBoard', affiliatePastorsBoardSchema);

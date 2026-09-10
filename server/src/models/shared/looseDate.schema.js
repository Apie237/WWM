import { Schema } from 'mongoose';

// Reusable embedded sub-schema for a date that may not be known precisely —
// used anywhere Phase 2 models need to record a start/end/born/died/established
// date. docs/PROJECT_SPEC.md §12 requires preserving uncertainty in historical
// dates rather than resolving it, so `year` and `approximate` exist alongside
// `date` instead of forcing every date to a single exact JS Date value.
export const looseDateSchema = new Schema(
  {
    date: { type: Date },
    year: { type: Number, min: 1500, max: 2200 },
    approximate: { type: Boolean, default: false },
  },
  { _id: false }
);

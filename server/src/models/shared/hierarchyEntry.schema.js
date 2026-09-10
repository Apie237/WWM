import { Schema } from 'mongoose';
import { looseDateSchema } from './looseDate.schema.js';

// Reusable embedded sub-schema for one entry in a leadership hierarchy.
// Shared by CountryAdministration.positions and AffiliatePastorsBoard.members
// so both org-chart-style structures use one schema definition instead of two
// near-duplicate ones (docs/CLAUDE.md "reuse components and services instead
// of duplicating logic").
//
// The hierarchy shape itself (who reports to whom) is expressed generically
// via `parentEntry`, which points to the Mongoose-assigned `_id` of another
// entry in the *same* array — not a `ref` to a separate collection. This lets
// the frontend reconstruct an arbitrary tree (see docs/DESIGN_SPEC.md §6/§7)
// from a flat list without any position names, tier counts, or reporting
// relationships being hardcoded into the schema or into React.
export const hierarchyEntrySchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    person: { type: Schema.Types.ObjectId, ref: 'Person', default: null },
    parentEntry: { type: Schema.Types.ObjectId, default: null },
    order: { type: Number, default: 0 },
    current: { type: Boolean, default: true },
    start: looseDateSchema,
    end: looseDateSchema,
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: false }
);

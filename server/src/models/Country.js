import mongoose, { Schema } from 'mongoose';
import { slugify } from '../utils/slugify.js';

// Countries reference Continent rather than embedding continent data
// (docs/PROJECT_SPEC.md §6 rule 1, §9). This model backs the reusable
// /mission-locations/:continent/:country template — no per-country schema
// or React page is ever created from it.
//
// `flagImageUrl` and `contact` are lightweight structural fields, not a
// Cloudinary integration (that remains Phase 9). They exist because
// docs/DESIGN_SPEC.md §4-§5 requires a flag and contact information on every
// country page and no dedicated model covers either — see the Phase 2 report
// for this interpretation decision.
const countrySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 150 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 170 },
    isoCode: { type: String, trim: true, uppercase: true, maxlength: 3, unique: true, sparse: true },
    continent: { type: Schema.Types.ObjectId, ref: 'Continent', required: true },
    overview: { type: String, trim: true, maxlength: 5000 },
    flagImageUrl: { type: String, trim: true, maxlength: 500 },
    contact: {
      headquartersAddress: { type: String, trim: true, maxlength: 500 },
      mailingAddress: { type: String, trim: true, maxlength: 500 },
      phone: { type: String, trim: true, maxlength: 50 },
      email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

countrySchema.pre('validate', function generateSlug() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

countrySchema.index({ continent: 1, isActive: 1 });

export default mongoose.models.Country || mongoose.model('Country', countrySchema);

import mongoose, { Schema } from 'mongoose';
import { slugify } from '../utils/slugify.js';

// World Wide Missions → Continents → Countries → Country information
// (docs/PROJECT_SPEC.md §5). Continent is a distinct, explicit model per
// §6 rule 1 — not a node in a generic self-referencing Location tree.
const continentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 120 },
    code: { type: String, trim: true, uppercase: true, maxlength: 10 },
    description: { type: String, trim: true, maxlength: 3000 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

continentSchema.pre('validate', function generateSlug() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

continentSchema.index({ isActive: 1 });

export default mongoose.models.Continent || mongoose.model('Continent', continentSchema);

import { Continent } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';

// Strips Mongoose's internal version key from every public response.
// None of the Phase 2 fields on Continent are admin-only, so this is the
// only projection needed to keep the response a clean public shape.
const PUBLIC_PROJECTION = '-__v';

export async function listContinents({ sort }) {
  return Continent.find({ isActive: true }).select(PUBLIC_PROJECTION).sort(sort).lean();
}

export async function getContinentBySlug(slug) {
  const continent = await Continent.findOne({ slug, isActive: true }).select(PUBLIC_PROJECTION).lean();
  if (!continent) {
    throw new ApiError(404, `Continent not found: ${slug}`);
  }
  return continent;
}

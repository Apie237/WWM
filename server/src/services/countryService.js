import { Country } from '../models/index.js';
import { getContinentBySlug } from './continentService.js';
import { ApiError } from '../utils/apiError.js';

const PUBLIC_PROJECTION = '-__v';

export async function listCountries({ sort, skip, limit, continentId }) {
  const filter = { isActive: true };
  if (continentId) filter.continent = continentId;

  const [items, total] = await Promise.all([
    Country.find(filter)
      .select(PUBLIC_PROJECTION)
      .populate({ path: 'continent', select: 'name slug' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Country.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getCountryBySlug(slug) {
  const country = await Country.findOne({ slug, isActive: true })
    .select(PUBLIC_PROJECTION)
    .populate({ path: 'continent', select: 'name slug' })
    .lean();
  if (!country) {
    throw new ApiError(404, `Country not found: ${slug}`);
  }
  return country;
}

// Resolves the continent first (404s if it doesn't exist), then reuses
// listCountries filtered to it — supports GET /api/continents/:slug/countries
// without duplicating the country query logic.
export async function listCountriesByContinentSlug(continentSlug, { sort, skip, limit }) {
  const continent = await getContinentBySlug(continentSlug);
  return listCountries({ sort, skip, limit, continentId: continent._id });
}

// Internal helper for other services (organizations/ministries/people
// filters, country administration, affiliate pastors board) that need to
// resolve a country slug down to its _id without pulling in the full public
// projection/population used by getCountryBySlug. Always 404s rather than
// returning null, so callers that need "the country must exist" get it for
// free; callers treating an unmatched country as an empty filter result
// should catch the rejection themselves.
export async function resolveCountryDocBySlug(slug) {
  const country = await Country.findOne({ slug, isActive: true }).select('_id name slug').lean();
  if (!country) {
    throw new ApiError(404, `Country not found: ${slug}`);
  }
  return country;
}

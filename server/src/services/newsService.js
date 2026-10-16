import { News } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { resolveCountryDocBySlug } from './countryService.js';

const PUBLIC_PROJECTION = '-__v -notes';

// Public = published and already past its publishedAt date.
function publicFilter() {
  return { status: 'published', publishedAt: { $lte: new Date() } };
}

export async function listNews({ sort, skip, limit, countrySlug }) {
  const filter = publicFilter();
  if (countrySlug !== undefined) {
    const country = await resolveCountryDocBySlug(countrySlug).catch(() => null);
    if (!country) return { items: [], total: 0 };
    filter.country = country._id;
  }
  const [items, total] = await Promise.all([
    News.find(filter).select(PUBLIC_PROJECTION).populate({ path: 'country', select: 'name slug' }).sort(sort).skip(skip).limit(limit).lean(),
    News.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getNewsBySlug(slug) {
  const item = await News.findOne({ ...publicFilter(), slug })
    .select(PUBLIC_PROJECTION)
    .populate({ path: 'country', select: 'name slug' })
    .lean();
  if (!item) throw new ApiError(404, `News article not found: ${slug}`);
  return item;
}

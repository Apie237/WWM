import { HistoryEvent } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { HISTORY_SECTIONS } from '../models/enums.js';
import { resolveCountryDocBySlug } from './countryService.js';

// Private editorial fields never leave the server through the public API.
const PUBLIC_PROJECTION = '-__v -notes -reviewStatus -reviewNote -imagePublicId -status';

export async function listHistory({ section, countrySlug, limit }) {
  const filter = { status: 'published' };

  if (section !== undefined) {
    if (!HISTORY_SECTIONS.includes(section)) {
      throw new ApiError(400, `Invalid "section" query parameter. Allowed values: ${HISTORY_SECTIONS.join(', ')}.`);
    }
    filter.section = section;
  }

  if (countrySlug !== undefined) {
    const country = await resolveCountryDocBySlug(countrySlug).catch(() => null);
    if (!country) return { items: [], total: 0 };
    filter.country = country._id;
  }

  const [items, total] = await Promise.all([
    HistoryEvent.find(filter)
      .select(PUBLIC_PROJECTION)
      .populate({ path: 'people', select: 'displayName slug photoUrl' })
      .populate({ path: 'country', select: 'name slug' })
      .sort({ order: 1, year: 1, createdAt: 1 })
      .limit(limit)
      .lean(),
    HistoryEvent.countDocuments(filter),
  ]);
  return { items, total };
}

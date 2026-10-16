import { Event } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { resolveCountryDocBySlug } from './countryService.js';

const PUBLIC_PROJECTION = '-__v -notes';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// `when`: "upcoming" (not yet ended), "past", or undefined (all published).
export function buildEventFilter(when, now = new Date()) {
  const filter = { status: 'published' };
  if (when === 'upcoming') {
    filter.$or = [{ endDate: { $gte: now } }, { endDate: null, startDate: { $gte: startOfToday() } }];
  } else if (when === 'past') {
    filter.$nor = [{ endDate: { $gte: now } }, { endDate: null, startDate: { $gte: startOfToday() } }];
  }
  return filter;
}

export async function listEvents({ sort, skip, limit, countrySlug, when }) {
  if (when !== undefined && when !== 'upcoming' && when !== 'past') {
    throw new ApiError(400, 'Invalid "when" query parameter. Allowed values: upcoming, past.');
  }
  const filter = buildEventFilter(when);
  if (countrySlug !== undefined) {
    const country = await resolveCountryDocBySlug(countrySlug).catch(() => null);
    if (!country) return { items: [], total: 0 };
    filter.country = country._id;
  }
  const [items, total] = await Promise.all([
    Event.find(filter).select(PUBLIC_PROJECTION).populate({ path: 'country', select: 'name slug' }).sort(sort).skip(skip).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getEventBySlug(slug) {
  const item = await Event.findOne({ status: 'published', slug })
    .select(PUBLIC_PROJECTION)
    .populate({ path: 'country', select: 'name slug' })
    .lean();
  if (!item) throw new ApiError(404, `Event not found: ${slug}`);
  return item;
}

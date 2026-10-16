import { PrayerRequest } from '../models/index.js';
import { cleanString } from '../utils/inputValidation.js';
import { resolveCountryDocBySlug } from './countryService.js';

// Public list: approved requests only, and only the fields safe to show.
// The submitter's name is included only when they opted in (`showName`).
export async function listApprovedPrayerRequests({ sort, skip, limit }) {
  const filter = { status: 'approved' };
  const [rows, total] = await Promise.all([
    PrayerRequest.find(filter).select('name showName request country createdAt').populate({ path: 'country', select: 'name slug' }).sort(sort).skip(skip).limit(limit).lean(),
    PrayerRequest.countDocuments(filter),
  ]);
  const items = rows.map((r) => ({
    _id: r._id,
    request: r.request,
    name: r.showName && r.name ? r.name : null,
    country: r.country || null,
    createdAt: r.createdAt,
  }));
  return { items, total };
}

// Only whitelisted fields are read from the body; `status` and
// `moderationNote` can never be set by a public submitter.
export async function createPrayerRequest(body = {}) {
  const request = cleanString(body.request, 'request', { required: true, max: 2000 });
  const name = cleanString(body.name, 'name', { max: 100 });
  const data = { request, name, showName: Boolean(name) && body.showName === true };

  const countrySlug = cleanString(body.country, 'country', { max: 120 });
  if (countrySlug) {
    const country = await resolveCountryDocBySlug(countrySlug).catch(() => null);
    if (country) data.country = country._id;
  }

  const doc = await PrayerRequest.create(data);
  return { _id: doc._id, status: doc.status };
}

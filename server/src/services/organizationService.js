import { Organization } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { ORGANIZATION_TYPES } from '../models/enums.js';
import { resolveCountryDocBySlug } from './countryService.js';

const PUBLIC_PROJECTION = '-__v';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listOrganizations({ sort, skip, limit, countrySlug, type, search }) {
  const filter = { isActive: true };

  if (type !== undefined) {
    if (!ORGANIZATION_TYPES.includes(type)) {
      throw new ApiError(400, `Invalid "type" query parameter. Allowed values: ${ORGANIZATION_TYPES.join(', ')}.`);
    }
    filter.type = type;
  }

  if (countrySlug !== undefined) {
    // An unrecognized country filter yields an empty list, not a 404 — this
    // is a list filter, not a direct resource lookup by slug.
    const country = await resolveCountryDocBySlug(countrySlug).catch(() => null);
    if (!country) return { items: [], total: 0 };
    filter.country = country._id;
  }

  if (search !== undefined && search.trim() !== '') {
    // Phase 2 did not add a MongoDB text index to Organization, and adding
    // one is out of scope for Phase 3 ("do not add unnecessary indexes
    // unless the API introduces a clearly justified query pattern" — a
    // dedicated text index is a bigger commitment than this read API
    // currently needs). A case-insensitive regex on `name` is a
    // proportionate implementation of "search" against the existing schema.
    filter.name = { $regex: escapeRegExp(search.trim()), $options: 'i' };
  }

  const [items, total] = await Promise.all([
    Organization.find(filter)
      .select(PUBLIC_PROJECTION)
      .populate({ path: 'country', select: 'name slug' })
      .populate({ path: 'leaders.person', select: 'displayName photoUrl' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Organization.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getOrganizationBySlug(slug) {
  const organization = await Organization.findOne({ slug, isActive: true })
    .select(PUBLIC_PROJECTION)
    .populate({ path: 'country', select: 'name slug' })
    .populate({ path: 'leaders.person', select: 'displayName photoUrl' })
    .lean();
  if (!organization) {
    throw new ApiError(404, `Organization not found: ${slug}`);
  }
  return organization;
}

// Internal helper mirroring countryService.resolveCountryDocBySlug, used by
// ministryService/personService to resolve an `organization` filter slug.
export async function resolveOrganizationDocBySlug(slug) {
  const organization = await Organization.findOne({ slug, isActive: true }).select('_id name slug').lean();
  if (!organization) {
    throw new ApiError(404, `Organization not found: ${slug}`);
  }
  return organization;
}

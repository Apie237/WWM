import { Ministry } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { MINISTRY_TYPES } from '../models/enums.js';
import { resolveCountryDocBySlug } from './countryService.js';
import { resolveOrganizationDocBySlug } from './organizationService.js';

const PUBLIC_PROJECTION = '-__v';

export async function listMinistries({ sort, skip, limit, countrySlug, organizationSlug, ministryType }) {
  const filter = { isActive: true };

  if (ministryType !== undefined) {
    if (!MINISTRY_TYPES.includes(ministryType)) {
      throw new ApiError(400, `Invalid "ministryType" query parameter. Allowed values: ${MINISTRY_TYPES.join(', ')}.`);
    }
    filter.ministryType = ministryType;
  }

  if (countrySlug !== undefined) {
    const country = await resolveCountryDocBySlug(countrySlug).catch(() => null);
    if (!country) return { items: [], total: 0 };
    filter.country = country._id;
  }

  if (organizationSlug !== undefined) {
    const organization = await resolveOrganizationDocBySlug(organizationSlug).catch(() => null);
    if (!organization) return { items: [], total: 0 };
    filter.organization = organization._id;
  }

  const [items, total] = await Promise.all([
    Ministry.find(filter)
      .select(PUBLIC_PROJECTION)
      .populate({ path: 'country', select: 'name slug' })
      .populate({ path: 'organization', select: 'name slug' })
      .populate({ path: 'responsiblePeople.person', select: 'displayName photoUrl' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Ministry.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getMinistryBySlug(slug) {
  const ministry = await Ministry.findOne({ slug, isActive: true })
    .select(PUBLIC_PROJECTION)
    .populate({ path: 'country', select: 'name slug' })
    .populate({ path: 'organization', select: 'name slug' })
    .populate({ path: 'responsiblePeople.person', select: 'displayName photoUrl' })
    .lean();
  if (!ministry) {
    throw new ApiError(404, `Ministry not found: ${slug}`);
  }
  return ministry;
}

import { Person } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { PERSON_ROLE_TYPES } from '../models/enums.js';
import { resolveCountryDocBySlug } from './countryService.js';
import { resolveOrganizationDocBySlug } from './organizationService.js';
import { isValidObjectId } from '../utils/queryHelpers.js';

const PUBLIC_PROJECTION = '-__v';

export async function listPeople({ sort, skip, limit, role, countrySlug, organizationSlug, current }) {
  const filter = { isActive: true };

  // role/country/organization/current all describe properties of a single
  // role entry (docs/PROJECT_SPEC.md §7 — a person can hold multiple roles).
  // They are combined into one $elemMatch rather than separate top-level
  // dot-path filters, so "role=pastor&country=X" only matches a person who
  // has one role entry that is BOTH pastor AND in country X — not a person
  // who merely has a pastor role somewhere and a country-X role elsewhere.
  const roleMatch = {};

  if (role !== undefined) {
    if (!PERSON_ROLE_TYPES.includes(role)) {
      throw new ApiError(400, `Invalid "role" query parameter. Allowed values: ${PERSON_ROLE_TYPES.join(', ')}.`);
    }
    roleMatch.roleType = role;
  }

  if (countrySlug !== undefined) {
    const country = await resolveCountryDocBySlug(countrySlug).catch(() => null);
    if (!country) return { items: [], total: 0 };
    roleMatch.country = country._id;
  }

  if (organizationSlug !== undefined) {
    const organization = await resolveOrganizationDocBySlug(organizationSlug).catch(() => null);
    if (!organization) return { items: [], total: 0 };
    roleMatch.organization = organization._id;
  }

  if (current !== undefined) {
    roleMatch.current = current === 'true';
  }

  if (Object.keys(roleMatch).length > 0) {
    filter.roles = { $elemMatch: roleMatch };
  }

  const [items, total] = await Promise.all([
    Person.find(filter).select(PUBLIC_PROJECTION).sort(sort).skip(skip).limit(limit).lean(),
    Person.countDocuments(filter),
  ]);

  return { items, total };
}

// Person has an optional slug (see docs/PROJECT_SPEC.md interpretation in
// Phase 2's report), so the :id route param may be either a Mongo ObjectId
// or a slug. Checking the format up front avoids ever handing an invalid
// string to Mongoose's ObjectId casting (which would throw a CastError
// without a `.status`, producing a misleading 500 instead of a 404).
export async function getPersonByIdOrSlug(idOrSlug) {
  const query = isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const person = await Person.findOne({ ...query, isActive: true }).select(PUBLIC_PROJECTION).lean();
  if (!person) {
    throw new ApiError(404, `Person not found: ${idOrSlug}`);
  }
  return person;
}

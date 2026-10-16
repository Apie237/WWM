import { ApiError } from './apiError.js';
import { isValidObjectId } from './queryHelpers.js';
import { Person, Organization } from '../models/index.js';

// Shared, small helpers used by the Phase 7 admin/CMS controllers and
// services. Deliberately kept to plain functions (not a generic CRUD
// factory/abstraction) so each admin module's service/controller stays an
// explicit, readable file in the same style as the existing Phase 3 public
// ones (docs/CLAUDE.md "Avoid unnecessary abstraction").

// Mass-assignment guard (docs/CLAUDE.md Phase 7 §5 "Accept only explicitly
// permitted fields"): returns a new object containing only the allowed keys
// that were actually present on `body`, so a client can never set fields
// like `_id`, `createdAt`, or any field a given module doesn't expose for
// writing, no matter what the request body contains.
export function pickAllowed(body = {}, fields = []) {
  const result = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] = body[field];
    }
  }
  return result;
}

// Validates a route param is a well-formed ObjectId before it ever reaches
// Mongoose — an invalid id should be a 400 ("bad request"), not a 500 from an
// uncaught CastError.
export function requireObjectIdParam(value, label = 'id') {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label}: must be a valid id.`);
  }
  return value;
}

// Same check for an id supplied inside a request body (a reference field
// such as `continent`, `country`, or `person`), with a field-specific message.
export function requireObjectIdField(value, fieldName) {
  if (value === undefined || value === null || !isValidObjectId(value)) {
    throw new ApiError(400, `"${fieldName}" must be a valid id.`);
  }
  return value;
}

// Validates every id in an array-of-references field (e.g. each leader's
// `person`, each role's `country`/`organization`) is a well-formed ObjectId
// *before* any of them are handed to a Mongoose `$in` query — a single
// malformed id in a `$in` array throws an uncaught CastError (a 500), not
// the project's normal 400. Falsy entries (nothing selected yet) are
// skipped; callers that require a value do that check separately.
export function requireValidObjectIdListField(ids, fieldLabel) {
  for (const id of ids) {
    if (id === undefined || id === null || id === '') continue;
    if (!isValidObjectId(id)) {
      throw new ApiError(400, `"${fieldLabel}" contains an invalid id: ${id}`);
    }
  }
}

// Translates a Mongoose duplicate-key error (E11000, raised by any of the
// existing unique indexes — Continent/Country/Organization/Ministry name or
// slug, CountryAdministration/AffiliatePastorsBoard's one-current-per-country
// partial index, User.email) into a safe 409 Conflict instead of letting it
// surface as an unhandled 500. Call from a controller's catch, or let it
// propagate to asyncHandler and check `err.code === 11000` there — used here
// as a small helper both admin controllers can share.
export function isDuplicateKeyError(err) {
  return err && err.code === 11000;
}

export function duplicateKeyMessage(err) {
  const field = err?.keyPattern ? Object.keys(err.keyPattern)[0] : 'value';
  return `A record with that ${field} already exists.`;
}

// Country-scope enforcement shared by every country-scoped admin module
// (Country itself, People, Organizations, Ministries, CountryAdministration,
// AffiliatePastorsBoard) per docs/CLAUDE.md Phase 7 §6: a COUNTRY_ADMIN's
// server-side role/country come only from their verified JWT (req.admin, set
// by requireAuth) — never from anything the client submits.
//
// `targetCountryId` must already be resolved from trustworthy data (the
// existing record being modified, or a reference that was itself validated
// to exist) — never taken directly from an unvalidated request body field.
export function assertCountryWritable(req, targetCountryId) {
  const { role, country } = req.admin;
  if (role === 'SUPER_ADMIN' || role === 'INTERNATIONAL_ADMIN') return;
  if (role !== 'COUNTRY_ADMIN') {
    throw new ApiError(403, 'You do not have permission to perform this action.');
  }
  if (!targetCountryId || String(targetCountryId) !== String(country?.id)) {
    throw new ApiError(403, 'You are not authorized to manage this country.');
  }
}

// Read-side equivalent: narrows a list/find filter to the COUNTRY_ADMIN's own
// country so they only ever see their own country's records, without relying
// on the frontend to apply that filter. No-op for every other role.
export function scopeFilterToCountry(req, filter, countryField = 'country') {
  if (req.admin.role === 'COUNTRY_ADMIN') {
    return { ...filter, [countryField]: req.admin.country?.id };
  }
  return filter;
}

// Escapes regex metacharacters in untrusted user input before it is used to
// build a MongoDB regex filter, so a search term like "a.*" or "(" can never
// be interpreted as a pattern (ReDoS/unexpected-match risk) — it is matched
// literally, case-insensitively.
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Adds a simple, case-insensitive "contains" search across one or more text
// fields to an existing filter object, used by every admin list endpoint
// that exposes a `?search=` query param (docs/CLAUDE.md Phase 7 "list/
// view/create/edit/delete/search/filter/pagination" requirement). A blank or
// missing `search` leaves `filter` untouched. Mutates and returns `filter`
// for convenience at call sites that build it inline.
export function applySearch(filter, search, fields) {
  const term = typeof search === 'string' ? search.trim() : '';
  if (!term) return filter;
  const regex = new RegExp(escapeRegExp(term), 'i');
  if (fields.length === 1) {
    filter[fields[0]] = regex;
  } else {
    filter.$or = fields.map((field) => ({ [field]: regex }));
  }
  return filter;
}

// True if the admin is allowed to manage (write/delete) the given country id
// — same rule as assertCountryWritable, exposed as a boolean for places that
// need to branch rather than throw (e.g. deciding which countries a
// COUNTRY_ADMIN may pick in a dropdown/filter).
export function canManageCountry(req, countryId) {
  const { role, country } = req.admin;
  if (role === 'SUPER_ADMIN' || role === 'INTERNATIONAL_ADMIN') return true;
  if (role !== 'COUNTRY_ADMIN') return false;
  return String(countryId) === String(country?.id);
}

// --- Relationship-level (cross-country) integrity ---------------------
//
// Record-level authorization (assertCountryWritable/scopeFilterToCountry
// above) only confines which Country/Organization/Ministry/etc *document* an
// admin may touch. It says nothing about whether the *references that
// document points at* (a leader, a responsible person, a board member)
// actually belong to that same country — a COUNTRY_ADMIN confined to their
// own country's Organization could still, before this check existed, pick
// any Person id in the whole database as a "leader," including one with no
// connection whatsoever to that country. These two helpers close that gap
// everywhere a person or organization is attached to a specific country
// (organization leaders, ministry responsible-people, country-administration
// positions, affiliate-pastors-board members, and a person's own roles).
//
// A person "belongs" to a country when they hold at least one role whose
// `country` matches it. A role with no country at all (`role.country` unset)
// is treated as internationally scoped and is accepted for *any* country —
// this is the deliberate, documented resolution of "preserve legitimate
// multi-country people and roles for authorized international
// administrators" / "do not prohibit legitimate relationships merely to
// simplify authorization": an internationally-scoped person (a founder, an
// international director, etc.) can legitimately be attached anywhere,
// while a person who only ever holds country-specific roles cannot be
// attached to a country they hold no role in. This applies uniformly to
// every caller (not only COUNTRY_ADMIN) because it is a data-integrity rule,
// not a permission check — combined with the existing record-level checks,
// it is what actually stops a COUNTRY_ADMIN from reaching across a country
// boundary through a reference instead of the record itself.
export async function assertPersonBelongsToCountry(personId, countryId, { fieldLabel = 'person' } = {}) {
  if (!personId || !countryId) return;
  requireObjectIdField(personId, fieldLabel);
  const person = await Person.findById(personId).select('roles.country').lean();
  if (!person) throw new ApiError(400, `Referenced person does not exist: ${personId}`);

  const roles = person.roles || [];
  const belongs = roles.some((r) => {
    if (!r.country) return true; // internationally-scoped role — allowed anywhere
    return String(r.country) === String(countryId);
  });
  if (!belongs) {
    throw new ApiError(
      400,
      `This person has no role in the required country and cannot be assigned to it here. Add a role for them in that country first, or use a person with an international (country-less) role.`
    );
  }
}

// Same relationship check for an Organization reference: the organization's
// own `country` must match the country the reference is being attached
// under (e.g. a Ministry's `organization` must belong to the Ministry's own
// `country`). Organization.country is required by its schema, so there is
// no "internationally scoped organization" equivalent to a country-less
// Person role.
export async function assertOrganizationBelongsToCountry(organizationId, countryId, { fieldLabel = 'organization' } = {}) {
  if (!organizationId || !countryId) return;
  requireObjectIdField(organizationId, fieldLabel);
  const org = await Organization.findById(organizationId).select('country').lean();
  if (!org) throw new ApiError(400, `Referenced organization does not exist: ${organizationId}`);

  if (String(org.country) !== String(countryId)) {
    throw new ApiError(400, 'The referenced organization belongs to a different country than this record.');
  }
}

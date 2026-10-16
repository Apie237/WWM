import { ApiError } from './apiError.js';
import { isValidObjectId } from './queryHelpers.js';

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

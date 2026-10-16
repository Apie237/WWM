import * as personAdminService from '../../services/admin/personAdminService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../../utils/queryHelpers.js';
import { requireObjectIdParam, isDuplicateKeyError, duplicateKeyMessage, applySearch } from '../../utils/adminHelpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';

const SORTABLE_FIELDS = ['displayName', 'order', 'createdAt'];

// A COUNTRY_ADMIN's own country id, or null for every other role (their
// requests are never filtered to one country here).
function ownCountryId(req) {
  return req.admin.role === 'COUNTRY_ADMIN' ? req.admin.country?.id : null;
}

export const listPeople = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'displayName');

  let filter = {};
  const countryId = ownCountryId(req);
  if (countryId) {
    // A COUNTRY_ADMIN only sees people who hold at least one role in their
    // own country — enforced here, not left to the frontend.
    filter.roles = { $elemMatch: { country: countryId } };
  } else if (req.query.country) {
    filter.roles = { $elemMatch: { country: requireObjectIdParam(req.query.country, 'country') } };
  }
  if (req.query.roleType) {
    filter.roles = { ...(filter.roles || {}), $elemMatch: { ...(filter.roles?.$elemMatch || {}), roleType: req.query.roleType } };
  }
  filter = applySearch(filter, req.query.search, ['displayName']);

  const { items, total } = await personAdminService.listPeopleAdmin({ sort, skip, limit, filter });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getPerson = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'person id');
  const data = await personAdminService.getPersonAdmin(id);

  const countryId = ownCountryId(req);
  if (countryId && !personAdminService.hasRoleInCountry(data.roles, countryId)) {
    throw new ApiError(403, 'You are not authorized to view this person.');
  }
  res.json({ success: true, data });
});

export const createPerson = asyncHandler(async (req, res) => {
  const countryId = ownCountryId(req);
  if (countryId) {
    // A COUNTRY_ADMIN may only create a person whose every role is scoped to
    // their own country, and must supply at least one role in that country —
    // otherwise they could create an internationally-scoped record, or one
    // they'd immediately lose the ability to see themselves.
    const roles = req.body?.roles;
    if (!Array.isArray(roles) || roles.length === 0 || !roles.every((r) => String(r.country) === String(countryId))) {
      throw new ApiError(400, 'As a country administrator, every role for this person must be in your assigned country.');
    }
  }

  try {
    const data = await personAdminService.createPersonAdmin(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

export const updatePerson = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'person id');
  const existing = await personAdminService.getPersonAdmin(id);

  const countryId = ownCountryId(req);
  if (countryId) {
    if (!personAdminService.hasRoleInCountry(existing.roles, countryId)) {
      throw new ApiError(403, 'You are not authorized to edit this person.');
    }
    if (req.body?.roles !== undefined) {
      const roles = req.body.roles;
      if (!Array.isArray(roles) || !roles.every((r) => String(r.country) === String(countryId))) {
        throw new ApiError(400, 'As a country administrator, every role for this person must be in your assigned country.');
      }
    }
  }

  try {
    const data = await personAdminService.updatePersonAdmin(id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

export const deletePerson = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'person id');
  const existing = await personAdminService.getPersonAdmin(id);

  const countryId = ownCountryId(req);
  if (countryId && !personAdminService.allRolesBelongToCountry(existing.roles, countryId)) {
    // Either they have no role in this country at all (not theirs to touch),
    // or they hold roles in other countries too (deleting the whole record
    // would remove data outside this admin's scope) — either way, reject.
    throw new ApiError(403, 'You are not authorized to delete this person.');
  }

  await personAdminService.deletePersonAdmin(id);
  res.json({ success: true, data: { message: 'Person deleted.' } });
});

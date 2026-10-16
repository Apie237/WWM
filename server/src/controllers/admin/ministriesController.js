import * as ministryAdminService from '../../services/admin/ministryAdminService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../../utils/queryHelpers.js';
import { requireObjectIdParam, isDuplicateKeyError, duplicateKeyMessage, assertCountryWritable, applySearch } from '../../utils/adminHelpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';

const SORTABLE_FIELDS = ['name', 'order', 'createdAt'];

export const listMinistries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'name');

  let filter = {};
  if (req.admin.role === 'COUNTRY_ADMIN') {
    // A country-less (international-scope) ministry is out of a
    // COUNTRY_ADMIN's reach entirely, same as one belonging to another
    // country.
    filter.country = req.admin.country?.id;
  } else if (req.query.country) {
    filter.country = requireObjectIdParam(req.query.country, 'country');
  }
  if (req.query.ministryType) filter.ministryType = req.query.ministryType;
  filter = applySearch(filter, req.query.search, ['name']);

  const { items, total } = await ministryAdminService.listMinistriesAdmin({ sort, skip, limit, filter });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getMinistry = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'ministry id');
  const data = await ministryAdminService.getMinistryAdmin(id);
  if (req.admin.role === 'COUNTRY_ADMIN') {
    const countryId = data.country?._id ?? data.country;
    if (!countryId || String(countryId) !== String(req.admin.country?.id)) {
      throw new ApiError(403, 'You are not authorized to view this ministry.');
    }
  }
  res.json({ success: true, data });
});

export const createMinistry = asyncHandler(async (req, res) => {
  if (req.admin.role === 'COUNTRY_ADMIN') {
    if (!req.body?.country) {
      throw new ApiError(400, 'As a country administrator, "country" is required and must be your assigned country.');
    }
    assertCountryWritable(req, req.body.country);
  }
  try {
    const data = await ministryAdminService.createMinistryAdmin(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

export const updateMinistry = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'ministry id');
  if (req.admin.role === 'COUNTRY_ADMIN') {
    const existing = await ministryAdminService.getMinistryAdmin(id);
    const existingCountryId = existing.country?._id ?? existing.country;
    if (!existingCountryId || String(existingCountryId) !== String(req.admin.country?.id)) {
      throw new ApiError(403, 'You are not authorized to edit this ministry.');
    }
    if (req.body?.country !== undefined) assertCountryWritable(req, req.body.country);
  }

  try {
    const data = await ministryAdminService.updateMinistryAdmin(id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

export const deleteMinistry = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'ministry id');
  if (req.admin.role === 'COUNTRY_ADMIN') {
    const existing = await ministryAdminService.getMinistryAdmin(id);
    const existingCountryId = existing.country?._id ?? existing.country;
    if (!existingCountryId || String(existingCountryId) !== String(req.admin.country?.id)) {
      throw new ApiError(403, 'You are not authorized to delete this ministry.');
    }
  }
  await ministryAdminService.deleteMinistryAdmin(id);
  res.json({ success: true, data: { message: 'Ministry deleted.' } });
});

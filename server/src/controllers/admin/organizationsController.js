import * as organizationAdminService from '../../services/admin/organizationAdminService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../../utils/queryHelpers.js';
import {
  requireObjectIdParam,
  isDuplicateKeyError,
  duplicateKeyMessage,
  assertCountryWritable,
  scopeFilterToCountry,
  applySearch,
} from '../../utils/adminHelpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';

const SORTABLE_FIELDS = ['name', 'type', 'order', 'createdAt'];

export const listOrganizations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'name');
  let filter = scopeFilterToCountry(req, {});
  if (req.query.type) filter.type = req.query.type;
  if (req.query.country && req.admin.role !== 'COUNTRY_ADMIN') filter.country = requireObjectIdParam(req.query.country, 'country');
  filter = applySearch(filter, req.query.search, ['name']);

  const { items, total } = await organizationAdminService.listOrganizationsAdmin({ sort, skip, limit, filter });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getOrganization = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'organization id');
  const data = await organizationAdminService.getOrganizationAdmin(id);
  const countryId = data.country?._id ?? data.country;
  if (req.admin.role === 'COUNTRY_ADMIN' && String(countryId) !== String(req.admin.country?.id)) {
    throw new ApiError(403, 'You are not authorized to view this organization.');
  }
  res.json({ success: true, data });
});

export const createOrganization = asyncHandler(async (req, res) => {
  if (req.admin.role === 'COUNTRY_ADMIN') {
    assertCountryWritable(req, req.body?.country);
  }
  try {
    const data = await organizationAdminService.createOrganizationAdmin(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'organization id');
  const existing = await organizationAdminService.getOrganizationAdmin(id);
  const existingCountryId = existing.country?._id ?? existing.country;

  if (req.admin.role === 'COUNTRY_ADMIN') {
    assertCountryWritable(req, existingCountryId);
    // Reassigning to a different country is also a country-scope escalation
    // attempt — reject it just as firmly as editing a record outside scope.
    if (req.body?.country !== undefined) {
      assertCountryWritable(req, req.body.country);
    }
  }

  try {
    const data = await organizationAdminService.updateOrganizationAdmin(id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

export const deleteOrganization = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'organization id');
  if (req.admin.role === 'COUNTRY_ADMIN') {
    const existing = await organizationAdminService.getOrganizationAdmin(id);
    assertCountryWritable(req, existing.country?._id ?? existing.country);
  }
  await organizationAdminService.deleteOrganizationAdmin(id);
  res.json({ success: true, data: { message: 'Organization deleted.' } });
});

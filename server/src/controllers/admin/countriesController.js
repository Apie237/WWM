import * as countryAdminService from '../../services/admin/countryAdminService.js';
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

const SORTABLE_FIELDS = ['name', 'order', 'createdAt'];
const { COUNTRY_WRITABLE_FIELDS, COUNTRY_CONTENT_ONLY_FIELDS } = countryAdminService;

export const listCountries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'name');
  // A COUNTRY_ADMIN only ever sees their own country in this list — scoped
  // server-side, not left to the frontend to filter.
  let filter = scopeFilterToCountry(req, {}, '_id');
  if (req.query.continent) filter.continent = requireObjectIdParam(req.query.continent, 'continent');
  filter = applySearch(filter, req.query.search, ['name']);
  const { items, total } = await countryAdminService.listCountriesAdmin({ sort, skip, limit, filter });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getCountry = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'country id');
  const data = await countryAdminService.getCountryAdmin(id);
  if (req.admin.role === 'COUNTRY_ADMIN' && String(data._id) !== String(req.admin.country?.id)) {
    throw new ApiError(403, 'You are not authorized to view this country.');
  }
  res.json({ success: true, data });
});

// Only SUPER_ADMIN/INTERNATIONAL_ADMIN reach this (route-level requireRole),
// so no country-scope check is needed here.
export const createCountry = asyncHandler(async (req, res) => {
  if (!req.body?.name) {
    throw new ApiError(400, '"name" is required.');
  }
  try {
    const data = await countryAdminService.createCountryAdmin(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

export const updateCountry = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'country id');
  assertCountryWritable(req, id);

  // A COUNTRY_ADMIN may only edit their own country's descriptive content
  // (overview/contact/flag) — not rename it, reassign its continent, or
  // change its active/ordering status (see countryAdminService's field-set
  // comment for the reasoning).
  const allowedFields = req.admin.role === 'COUNTRY_ADMIN' ? COUNTRY_CONTENT_ONLY_FIELDS : COUNTRY_WRITABLE_FIELDS;

  try {
    const data = await countryAdminService.updateCountryAdmin(id, req.body, allowedFields);
    res.json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

// Only SUPER_ADMIN/INTERNATIONAL_ADMIN reach this (route-level requireRole).
export const deleteCountry = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'country id');
  await countryAdminService.deleteCountryAdmin(id);
  res.json({ success: true, data: { message: 'Country deleted.' } });
});

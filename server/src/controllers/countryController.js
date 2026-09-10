import * as countryService from '../services/countryService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Alphabetical by name is the default per Phase 3 instructions ("sort
// countries consistently, preferably alphabetically unless an explicit
// display/order field ... and the specification requires otherwise") —
// `order` remains available as an explicit opt-in via ?sort=order.
const SORTABLE_FIELDS = ['name', 'order', 'createdAt'];

export const listCountries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'name');
  const { items, total } = await countryService.listCountries({ sort, skip, limit });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getCountry = asyncHandler(async (req, res) => {
  const data = await countryService.getCountryBySlug(req.params.slug);
  res.json({ success: true, data });
});

export const listCountriesByContinent = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'name');
  const { items, total } = await countryService.listCountriesByContinentSlug(req.params.slug, {
    sort,
    skip,
    limit,
  });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

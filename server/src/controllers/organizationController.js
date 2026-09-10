import * as organizationService from '../services/organizationService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SORTABLE_FIELDS = ['name', 'order', 'createdAt'];

export const listOrganizations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'name');
  const { country, type, search } = req.query;

  const { items, total } = await organizationService.listOrganizations({
    sort,
    skip,
    limit,
    countrySlug: country,
    type,
    search,
  });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getOrganization = asyncHandler(async (req, res) => {
  const data = await organizationService.getOrganizationBySlug(req.params.slug);
  res.json({ success: true, data });
});

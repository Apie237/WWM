import * as ministryService from '../services/ministryService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SORTABLE_FIELDS = ['name', 'order', 'createdAt'];

export const listMinistries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'name');
  const { country, organization, ministryType } = req.query;

  const { items, total } = await ministryService.listMinistries({
    sort,
    skip,
    limit,
    countrySlug: country,
    organizationSlug: organization,
    ministryType,
  });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getMinistry = asyncHandler(async (req, res) => {
  const data = await ministryService.getMinistryBySlug(req.params.slug);
  res.json({ success: true, data });
});

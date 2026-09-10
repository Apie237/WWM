import * as personService from '../services/personService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const SORTABLE_FIELDS = ['displayName', 'order', 'createdAt'];

export const listPeople = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'displayName');
  const { role, country, organization, current } = req.query;

  if (current !== undefined && !['true', 'false'].includes(current)) {
    throw new ApiError(400, 'Invalid "current" query parameter: must be "true" or "false".');
  }

  const { items, total } = await personService.listPeople({
    sort,
    skip,
    limit,
    role,
    countrySlug: country,
    organizationSlug: organization,
    current,
  });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

// Accepts either a Mongo ObjectId or a Person slug — see
// personService.getPersonByIdOrSlug for the resolution rule.
export const getPerson = asyncHandler(async (req, res) => {
  const data = await personService.getPersonByIdOrSlug(req.params.id);
  res.json({ success: true, data });
});

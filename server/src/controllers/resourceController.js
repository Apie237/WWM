import * as resourceService from '../services/resourceService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SORTABLE_FIELDS = ['order', 'title', 'publishedAt'];

export const listResources = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'order');
  const { items, total } = await resourceService.listResources({ sort, skip, limit, type: req.query.type });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

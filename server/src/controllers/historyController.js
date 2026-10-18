import * as historyService from '../services/historyService.js';
import { parsePagination, buildPaginationMeta } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Unpaginated by design for the page that renders the whole story at once, but
// still bounded (max 200) so the endpoint can never return an unlimited list.
export const listHistory = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query, { defaultLimit: 100, maxLimit: 200 });
  const { items, total } = await historyService.listHistory({
    section: req.query.section,
    countrySlug: req.query.country,
    limit,
  });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

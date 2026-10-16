import * as newsService from '../services/newsService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SORTABLE_FIELDS = ['publishedAt', 'title'];

export const listNews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort({ order: 'desc', ...req.query }, SORTABLE_FIELDS, 'publishedAt');
  const { items, total } = await newsService.listNews({ sort, skip, limit, countrySlug: req.query.country });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getNews = asyncHandler(async (req, res) => {
  const data = await newsService.getNewsBySlug(req.params.slug);
  res.json({ success: true, data });
});

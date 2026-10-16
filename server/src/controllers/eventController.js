import * as eventService from '../services/eventService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SORTABLE_FIELDS = ['startDate', 'title'];

export const listEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  // Upcoming events read soonest-first; everything else newest-first.
  const defaultOrder = req.query.when === 'upcoming' ? 'asc' : 'desc';
  const sort = parseSort({ order: defaultOrder, ...req.query }, SORTABLE_FIELDS, 'startDate');
  const { items, total } = await eventService.listEvents({ sort, skip, limit, countrySlug: req.query.country, when: req.query.when });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getEvent = asyncHandler(async (req, res) => {
  const data = await eventService.getEventBySlug(req.params.slug);
  res.json({ success: true, data });
});

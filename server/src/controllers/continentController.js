import * as continentService from '../services/continentService.js';
import { parseSort } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Continents are a small, bounded set (six, per docs/PROJECT_SPEC.md §5) —
// pagination would add noise without value here, so this list endpoint
// intentionally returns a plain array rather than a paginated envelope.
const SORTABLE_FIELDS = ['name', 'order', 'createdAt'];

export const listContinents = asyncHandler(async (req, res) => {
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'order');
  const data = await continentService.listContinents({ sort });
  res.json({ success: true, data });
});

export const getContinent = asyncHandler(async (req, res) => {
  const data = await continentService.getContinentBySlug(req.params.slug);
  res.json({ success: true, data });
});

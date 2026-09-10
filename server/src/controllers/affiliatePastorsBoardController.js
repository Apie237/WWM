import * as affiliatePastorsBoardService from '../services/affiliatePastorsBoardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAffiliatePastorsBoard = asyncHandler(async (req, res) => {
  const data = await affiliatePastorsBoardService.getCurrentBoardByCountrySlug(req.params.slug);
  res.json({ success: true, data });
});

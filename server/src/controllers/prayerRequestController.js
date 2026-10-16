import * as prayerRequestService from '../services/prayerRequestService.js';
import { parsePagination, buildPaginationMeta } from '../utils/queryHelpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listPrayerRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
  const { items, total } = await prayerRequestService.listApprovedPrayerRequests({ sort: { createdAt: -1 }, skip, limit });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

// Honeypot: real users never see the hidden "website" field. A bot that
// fills it gets the same success response but nothing is stored.
export const submitPrayerRequest = asyncHandler(async (req, res) => {
  if (req.body?.website) {
    res.status(201).json({ success: true, data: { received: true } });
    return;
  }
  await prayerRequestService.createPrayerRequest(req.body);
  res.status(201).json({ success: true, data: { received: true, message: 'Thank you. Your request will appear after review.' } });
});

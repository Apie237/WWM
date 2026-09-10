import * as countryAdministrationService from '../services/countryAdministrationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// data: null (200) means the country exists but has no current
// administration recorded yet — distinct from a 404, which means the
// country itself doesn't exist.
export const getCountryAdministration = asyncHandler(async (req, res) => {
  const data = await countryAdministrationService.getCurrentAdministrationByCountrySlug(req.params.slug);
  res.json({ success: true, data });
});

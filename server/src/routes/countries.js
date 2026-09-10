import { Router } from 'express';
import { listCountries, getCountry } from '../controllers/countryController.js';
import { getCountryAdministration } from '../controllers/countryAdministrationController.js';
import { getAffiliatePastorsBoard } from '../controllers/affiliatePastorsBoardController.js';

const router = Router();

router.get('/', listCountries);
// Country-oriented routes for CountryAdministration and AffiliatePastorsBoard
// (per Phase 3 instructions' stated preference) rather than separate
// top-level /api/country-administrations and /api/affiliate-pastors-boards
// resources — see the Phase 3 report for why the nested-only route was
// chosen.
router.get('/:slug/administration', getCountryAdministration);
router.get('/:slug/affiliate-pastors', getAffiliatePastorsBoard);
router.get('/:slug', getCountry);

export default router;

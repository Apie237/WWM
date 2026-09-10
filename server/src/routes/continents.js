import { Router } from 'express';
import { listContinents, getContinent } from '../controllers/continentController.js';
import { listCountriesByContinent } from '../controllers/countryController.js';

const router = Router();

router.get('/', listContinents);
// GET /api/continents/:slug/countries — resolves the continent by slug first
// (404 if it doesn't exist), then returns its countries. Keeps continent
// detail responses from duplicating the full country list (see
// countryService.listCountriesByContinentSlug).
router.get('/:slug/countries', listCountriesByContinent);
router.get('/:slug', getContinent);

export default router;

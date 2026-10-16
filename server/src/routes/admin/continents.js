import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  listContinents,
  getContinent,
  createContinent,
  updateContinent,
  deleteContinent,
} from '../../controllers/admin/continentsController.js';

// Continents are international-level structure, not a country-scoped
// resource (docs/PROJECT_SPEC.md §9), so there is no COUNTRY_ADMIN write
// path here to begin with — unlike the other admin modules, no per-request
// country-ownership check is needed. All authenticated admin roles may read
// (continents are needed as reference data for Country forms elsewhere in
// the CMS); only SUPER_ADMIN/INTERNATIONAL_ADMIN may write.
const router = Router();

router.use(requireAuth);

router.get('/', listContinents);
router.get('/:id', getContinent);
router.post('/', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN'), createContinent);
router.patch('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN'), updateContinent);
router.delete('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN'), deleteContinent);

export default router;

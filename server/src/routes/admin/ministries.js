import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { listMinistries, getMinistry, createMinistry, updateMinistry, deleteMinistry } from '../../controllers/admin/ministriesController.js';

// Same role policy as People/Organizations. COUNTRY_ADMIN scope (including
// the "country is required for a COUNTRY_ADMIN" rule — an international
// ministry has no country owner) is enforced inside ministriesController.
const router = Router();

router.use(requireAuth);

router.get('/', listMinistries);
router.get('/:id', getMinistry);
router.post('/', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'), createMinistry);
router.patch('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'), updateMinistry);
router.delete('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN'), deleteMinistry);

export default router;

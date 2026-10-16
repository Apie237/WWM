import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import c from '../../controllers/admin/resourcesAdminController.js';

// Resources are international (not country-owned), so a COUNTRY_ADMIN may
// read them but not write; editors and international admins manage them.
const router = Router();
router.use(requireAuth);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'CONTENT_EDITOR'), c.create);
router.patch('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'CONTENT_EDITOR'), c.update);
router.delete('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN'), c.remove);
export default router;

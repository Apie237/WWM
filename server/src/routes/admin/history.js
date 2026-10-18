import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import c from '../../controllers/admin/historyAdminController.js';

// History is organization-wide (not country-owned): every admin role may read
// it, editors and international admins write, and only SUPER_ADMIN /
// INTERNATIONAL_ADMIN may delete. COUNTRY_ADMIN is read-only.
const router = Router();
router.use(requireAuth);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'CONTENT_EDITOR'), c.create);
router.patch('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'CONTENT_EDITOR'), c.update);
router.delete('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN'), c.remove);
export default router;

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import c from '../../controllers/admin/newsAdminController.js';

// Same role policy as Ministries: all roles read; four roles write; COUNTRY_ADMIN
// is confined to their own country inside the controller.
const router = Router();
router.use(requireAuth);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'), c.create);
router.patch('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'), c.update);
router.delete('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN'), c.remove);
export default router;

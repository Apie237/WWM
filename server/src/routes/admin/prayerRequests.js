import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import c from '../../controllers/admin/prayerRequestsAdminController.js';

// Moderation inbox: no create route (submissions come only from the public
// form). CONTENT_EDITOR has no access — submissions can contain personal detail.
const router = Router();
router.use(requireAuth, requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN'));
router.get('/', c.list);
router.get('/:id', c.get);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);
export default router;

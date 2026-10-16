import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import c from '../../controllers/admin/contactMessagesAdminController.js';

// Contact inbox: international admins only (messages contain personal data).
const router = Router();
router.use(requireAuth, requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN'));
router.get('/', c.list);
router.get('/:id', c.get);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);
export default router;

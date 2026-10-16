import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from '../../controllers/admin/organizationsController.js';

// Same role policy as People (docs/PROJECT_SPEC.md §8's churches/
// institutions are "content" in the same sense) — all four roles read/write,
// delete excludes CONTENT_EDITOR. COUNTRY_ADMIN scope is enforced inside
// organizationsController.
const router = Router();

router.use(requireAuth);

router.get('/', listOrganizations);
router.get('/:id', getOrganization);
router.post('/', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'), createOrganization);
router.patch('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'), updateOrganization);
router.delete('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN'), deleteOrganization);

export default router;

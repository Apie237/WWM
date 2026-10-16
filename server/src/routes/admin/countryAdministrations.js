import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  listAdministrations,
  getAdministration,
  createAdministration,
  updateAdministration,
  deleteAdministration,
  addPosition,
  updatePosition,
  removePosition,
} from '../../controllers/admin/countryAdministrationsController.js';

// A country's leadership structure is governance/organizational data, not
// "content" (docs/PROJECT_SPEC.md §10) — per the documented Phase 7 role
// policy, CONTENT_EDITOR gets read access only here, unlike People/
// Organizations/Ministries. Write access: SUPER_ADMIN/INTERNATIONAL_ADMIN
// (any country) and COUNTRY_ADMIN (their own country only, enforced inside
// countryAdministrationsController).
const WRITE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN'];

const router = Router();

router.use(requireAuth);

router.get('/', listAdministrations);
router.get('/:id', getAdministration);
router.post('/', requireRole(...WRITE_ROLES), createAdministration);
router.patch('/:id', requireRole(...WRITE_ROLES), updateAdministration);
router.delete('/:id', requireRole(...WRITE_ROLES), deleteAdministration);

router.post('/:id/positions', requireRole(...WRITE_ROLES), addPosition);
router.patch('/:id/positions/:entryId', requireRole(...WRITE_ROLES), updatePosition);
router.delete('/:id/positions/:entryId', requireRole(...WRITE_ROLES), removePosition);

export default router;

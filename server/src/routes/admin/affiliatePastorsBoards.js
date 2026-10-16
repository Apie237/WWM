import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  listBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  updateMember,
  removeMember,
} from '../../controllers/admin/affiliatePastorsBoardsController.js';

// Mirrors routes/admin/countryAdministrations.js: this is governance/
// organizational data, not "content" — CONTENT_EDITOR gets read access only.
// Write access: SUPER_ADMIN/INTERNATIONAL_ADMIN (any country) and
// COUNTRY_ADMIN (their own country only, enforced in the controller).
const WRITE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN'];

const router = Router();

router.use(requireAuth);

router.get('/', listBoards);
router.get('/:id', getBoard);
router.post('/', requireRole(...WRITE_ROLES), createBoard);
router.patch('/:id', requireRole(...WRITE_ROLES), updateBoard);
router.delete('/:id', requireRole(...WRITE_ROLES), deleteBoard);

router.post('/:id/members', requireRole(...WRITE_ROLES), addMember);
router.patch('/:id/members/:entryId', requireRole(...WRITE_ROLES), updateMember);
router.delete('/:id/members/:entryId', requireRole(...WRITE_ROLES), removeMember);

export default router;

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { listCountries, getCountry, createCountry, updateCountry, deleteCountry } from '../../controllers/admin/countriesController.js';

// GET routes: open to every authenticated admin role (including
// CONTENT_EDITOR, who needs to see country data to manage People/
// Organizations/Ministries content). A COUNTRY_ADMIN's results are narrowed
// to their own country inside the controller/service, not here.
//
// Create/delete a country at all: SUPER_ADMIN/INTERNATIONAL_ADMIN only — a
// COUNTRY_ADMIN manages their assigned country's content, not the set of
// countries that exist. Update: those two roles plus COUNTRY_ADMIN (whose
// own-country-only + content-fields-only restriction is enforced inside
// countriesController.updateCountry, per docs/CLAUDE.md Phase 7 §6: country
// scope must be enforced server-side, never trusted from the client).
const router = Router();

router.use(requireAuth);

router.get('/', listCountries);
router.get('/:id', getCountry);
router.post('/', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN'), createCountry);
router.patch('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN'), updateCountry);
router.delete('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN'), deleteCountry);

export default router;

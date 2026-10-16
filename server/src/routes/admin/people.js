import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { listPeople, getPerson, createPerson, updatePerson, deletePerson } from '../../controllers/admin/peopleController.js';

// All four admin roles may read and write People (CONTENT_EDITOR included,
// per the documented Phase 7 policy decision — see docs/PROGRESS.md: a
// CONTENT_EDITOR manages organizational "content" such as People/
// Organizations/Ministries, but not structural data like Continents/
// Countries/CountryAdministration/AffiliatePastorsBoard). Delete is
// restricted to SUPER_ADMIN/INTERNATIONAL_ADMIN/COUNTRY_ADMIN only — not
// CONTENT_EDITOR, since removing a person record is a higher-trust action
// than editing their bio. A COUNTRY_ADMIN's scope to their own country's
// people is enforced inside peopleController, not here.
const router = Router();

router.use(requireAuth);

router.get('/', listPeople);
router.get('/:id', getPerson);
router.post('/', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'), createPerson);
router.patch('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'), updatePerson);
router.delete('/:id', requireRole('SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN'), deletePerson);

export default router;

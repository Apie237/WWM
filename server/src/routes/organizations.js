import { Router } from 'express';
import { listOrganizations, getOrganization } from '../controllers/organizationController.js';

const router = Router();

router.get('/', listOrganizations);
router.get('/:slug', getOrganization);

export default router;

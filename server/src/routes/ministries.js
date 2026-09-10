import { Router } from 'express';
import { listMinistries, getMinistry } from '../controllers/ministryController.js';

const router = Router();

router.get('/', listMinistries);
router.get('/:slug', getMinistry);

export default router;

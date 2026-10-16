import { Router } from 'express';
import { listResources } from '../controllers/resourceController.js';

const router = Router();
router.get('/', listResources);
export default router;

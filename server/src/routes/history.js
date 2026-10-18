import { Router } from 'express';
import { listHistory } from '../controllers/historyController.js';

const router = Router();
router.get('/', listHistory);
export default router;

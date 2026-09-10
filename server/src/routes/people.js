import { Router } from 'express';
import { listPeople, getPerson } from '../controllers/personController.js';

const router = Router();

router.get('/', listPeople);
router.get('/:id', getPerson);

export default router;

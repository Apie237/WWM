import { Router } from 'express';
import { submitContactMessage } from '../controllers/contactController.js';
import { publicSubmissionLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.post('/', publicSubmissionLimiter(), submitContactMessage);
export default router;

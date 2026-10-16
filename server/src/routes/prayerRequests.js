import { Router } from 'express';
import { listPrayerRequests, submitPrayerRequest } from '../controllers/prayerRequestController.js';
import { publicSubmissionLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.get('/', listPrayerRequests);
router.post('/', publicSubmissionLimiter(), submitPrayerRequest);
export default router;

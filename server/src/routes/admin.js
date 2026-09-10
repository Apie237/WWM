import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboard } from '../controllers/adminController.js';

const router = Router();

// Any authenticated admin role may load the dashboard shell — Phase 7's CMS
// modules are what will actually differentiate by role/country.
router.get('/dashboard', requireAuth, getDashboard);

export default router;

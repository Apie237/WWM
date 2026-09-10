import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

// Limits brute-force login attempts per IP (docs/CLAUDE.md Phase 6 §20:
// "rate limiting consideration for login"). Deliberately not applied to any
// other route — logout/me are idempotent reads/no-ops for an already-issued
// session, not a credential-guessing surface.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;

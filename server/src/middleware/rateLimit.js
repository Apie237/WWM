import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Limiter for public write endpoints (prayer requests, contact form).
// Uses the express-rate-limit dependency already installed in Phase 6.
// In-memory and per-IP: fine for one server instance; behind a proxy the
// deployment must set Express "trust proxy" so req.ip is the real client.
export function publicSubmissionLimiter({ limit = env.publicSubmissionLimit, windowMs = 60 * 60 * 1000 } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many submissions. Please try again later.' },
  });
}

import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';
import { ALLOWED_IMAGE_MIME } from '../../services/mediaService.js';
import { getMediaConfig, authorizeUpload, uploadImage } from '../../controllers/admin/mediaController.js';

const router = express.Router();
router.use(requireAuth);

// Per-admin cap on uploads (keyed by the verified admin id, not the client IP).
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.admin.id,
  message: { error: 'Too many uploads. Please try again later.' },
});

// Image bytes arrive as the raw request body (Content-Type: image/jpeg|png|webp)
// — no multipart parser dependency. Oversized bodies become a friendly 413.
const rawImage = express.raw({ type: ALLOWED_IMAGE_MIME, limit: env.mediaMaxUploadBytes });
function parseImageBody(req, res, next) {
  rawImage(req, res, (err) => {
    if (!err) return next();
    if (err.type === 'entity.too.large') {
      const mb = Math.round((env.mediaMaxUploadBytes / (1024 * 1024)) * 10) / 10;
      return next(new ApiError(413, `This image is too large. The maximum size is ${mb} MB.`));
    }
    return next(err);
  });
}

router.get('/config', getMediaConfig);
router.post('/upload/:kind', uploadLimiter, authorizeUpload, parseImageBody, uploadImage);

export default router;

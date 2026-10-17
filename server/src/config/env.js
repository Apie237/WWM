import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

// JWT_SECRET must come from the environment in production (never hardcoded —
// docs/CLAUDE.md Security Rules / Phase 6 §6). In development, a missing
// secret falls back to a random value generated once per process start
// rather than a fixed literal, so no usable secret ever lives in source
// control; the tradeoff (existing dev sessions are invalidated on restart)
// is acceptable for local development.
function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (nodeEnv === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  console.warn('[env] JWT_SECRET not set — using a random per-process secret for local development only.');
  return crypto.randomBytes(48).toString('hex');
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wwm',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // Max public prayer-request / contact submissions per IP per hour (Phase 8).
  // Optional; defaults to 5. Raised only by the automated tests.
  // Phase 9 — Cloudinary. All three secrets stay server-side; image uploads are
  // disabled (clear 503) when any is missing, so local dev works without them.
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  // Max image upload size. Default 4 MB stays under Vercel's ~4.5 MB request-body limit.
  mediaMaxUploadBytes: Math.round((Number(process.env.MEDIA_MAX_UPLOAD_MB) || 4) * 1024 * 1024),
  publicSubmissionLimit: Number(process.env.PUBLIC_SUBMISSION_LIMIT) || 5,
};

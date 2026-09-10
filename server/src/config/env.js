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
};

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

// Phase 10: in production a missing MONGODB_URI / CLIENT_ORIGIN must fail
// loudly at startup instead of silently falling back to localhost values
// (which would give a deployment that "runs" but cannot reach its database
// or accept requests from the real frontend).
function requireInProduction(name, devDefault) {
  if (process.env[name]) return process.env[name];
  if (nodeEnv === 'production') {
    throw new Error(`${name} environment variable is required in production.`);
  }
  return devDefault;
}

const jwtSecret = resolveJwtSecret();
if (nodeEnv === 'production' && jwtSecret.length < 32) {
  console.warn('[env] JWT_SECRET is shorter than 32 characters; use a long random value.');
}

const cloudinaryVars = [process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET];
if (cloudinaryVars.some(Boolean) && !cloudinaryVars.every(Boolean)) {
  console.warn('[env] Cloudinary is only partly configured; image uploads stay disabled until all three CLOUDINARY_* variables are set.');
}

// CLIENT_ORIGIN is a comma-separated allowlist of EXACT browser origins
// (scheme://host[:port]), e.g. "http://localhost:5173" in development or the
// production domain plus a www alias. Never "*": the admin cookie requires
// credentialed CORS.
//
// Each entry is parsed as a URL and reduced to its origin, so harmless
// variations (trailing slash, a path, upper-case host) still match what the
// browser sends. An entry that is not a valid http(s) origin (for example
// "localhost:5173" with no scheme) could never match any request, so it is
// reported instead of being silently kept. Note that "localhost" and
// "127.0.0.1" are different origins.
export function parseClientOrigins(raw) {
  const origins = [];
  const invalid = [];
  for (const piece of String(raw).split(',')) {
    const entry = piece.trim();
    if (!entry) continue;
    if (entry.includes('*')) throw new Error('CLIENT_ORIGIN must list explicit origins, not "*".');
    let url = null;
    try {
      url = new URL(entry);
    } catch {
      /* invalid, handled below */
    }
    if (!url || !['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      invalid.push(entry);
      continue;
    }
    if (!origins.includes(url.origin)) origins.push(url.origin);
  }
  return { origins, invalid };
}

const { origins: clientOrigins, invalid: invalidClientOrigins } = parseClientOrigins(
  requireInProduction('CLIENT_ORIGIN', 'http://localhost:5173')
);
if (invalidClientOrigins.length) {
  console.warn(
    `[env] Ignoring invalid CLIENT_ORIGIN entr${invalidClientOrigins.length === 1 ? 'y' : 'ies'}: ` +
      `${invalidClientOrigins.map((e) => JSON.stringify(e)).join(', ')}. Use scheme://host[:port], e.g. http://localhost:5173.`
  );
}
if (!clientOrigins.length) {
  throw new Error('CLIENT_ORIGIN contains no valid origin. Use scheme://host[:port], e.g. http://localhost:5173.');
}

// Number of reverse-proxy hops in front of Express (0 = none). On Vercel the
// platform proxy is exactly one hop, so that is the default there. Needed so
// rate limiting keys on the real client IP rather than the proxy's.
function resolveTrustProxy() {
  if (process.env.TRUST_PROXY !== undefined && process.env.TRUST_PROXY !== '') {
    const hops = Number(process.env.TRUST_PROXY);
    return Number.isInteger(hops) && hops >= 0 ? hops : 0;
  }
  return process.env.VERCEL ? 1 : 0;
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv,
  mongodbUri: requireInProduction('MONGODB_URI', 'mongodb://127.0.0.1:27017/wwm'),
  clientOrigin: clientOrigins[0],
  clientOrigins,
  trustProxy: resolveTrustProxy(),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // Phase 9 — Cloudinary. All three secrets stay server-side; image uploads are
  // disabled (clear 503) when any is missing, so local dev works without them.
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  // Max image upload size. Default 4 MB stays under Vercel's ~4.5 MB request-body limit.
  mediaMaxUploadBytes: Math.round((Number(process.env.MEDIA_MAX_UPLOAD_MB) || 4) * 1024 * 1024),
  // Max public prayer-request / contact submissions per IP per hour (Phase 8).
  // Optional; defaults to 5. Raised only by the automated tests.
  publicSubmissionLimit: Number(process.env.PUBLIC_SUBMISSION_LIMIT) || 5,
};

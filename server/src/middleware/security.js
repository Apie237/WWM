import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

// Phase 10 request-level protections. Each is small and independent.

// With Express's "simple" query parser, `?a[$ne]=x` is just a literal key, but
// a repeated key (`?country=a&country=b`) still arrives as an array. No API
// endpoint accepts array-valued query parameters, and handing one to a Mongo
// filter or a string method causes a CastError/TypeError (a 500). Reject it
// up front as a client error.
export function rejectNonStringQuery(req, res, next) {
  for (const value of Object.values(req.query)) {
    if (typeof value !== 'string') {
      next(new ApiError(400, 'Invalid query parameters.'));
      return;
    }
  }
  next();
}

// Defence in depth for a cookie that is SameSite=None in production: a
// browser always sends an Origin header on cross-origin and on non-GET
// requests, so a state-changing request from any origin outside the
// allowlist is refused even if CORS preflight were ever relaxed. Requests
// with no Origin (curl, server-to-server, same-origin GET) are unaffected —
// they still need a valid token. Safe methods are never blocked here.
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export function requireTrustedOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (SAFE_METHODS.has(req.method) || !origin || env.clientOrigins.includes(origin)) {
    next();
    return;
  }
  next(new ApiError(403, 'Request origin is not allowed.'));
}

// Admin and auth responses contain personal data and session state; keep
// browsers and shared caches from storing them.
export function noStore(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

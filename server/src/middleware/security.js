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

// CORS origin check (used by app.js). Only the exact configured origins get CORS
// headers; anything else gets none, so the browser blocks the response. A request
// with no Origin header (curl, server-to-server) is not a CORS request.
//
// In development a blocked origin is the single most common local-setup problem
// (CLIENT_ORIGIN not matching the address in the browser bar), and the browser
// only says "No Access-Control-Allow-Origin header". So, outside production,
// say once per origin what was blocked and what is allowed. Origins are not
// secrets; the value is JSON-quoted and length-capped so it cannot forge log lines.
const reportedOrigins = new Set();
export function corsOrigin(origin, callback) {
  if (!origin || env.clientOrigins.includes(origin)) {
    callback(null, origin || true);
    return;
  }
  if (env.nodeEnv !== 'production' && reportedOrigins.size < 20 && !reportedOrigins.has(origin)) {
    reportedOrigins.add(origin);
    console.warn(
      `[cors] Blocked a request from origin ${JSON.stringify(String(origin).slice(0, 200))}. ` +
        `Allowed origins: ${env.clientOrigins.join(', ')}. ` +
        'To allow this frontend, set CLIENT_ORIGIN in server/.env to its exact address (scheme://host:port) and restart the server.'
    );
  }
  callback(null, false);
}

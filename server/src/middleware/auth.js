import { verifyAdminToken, getActiveAdminById, toAdminSummary } from '../services/authService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ADMIN_COOKIE_NAME } from '../config/auth.js';

// Reads the httpOnly cookie first (the frontend's normal path); a Bearer
// header is also accepted so the API remains testable from curl/Postman
// without a cookie jar. Neither client state nor request body is ever
// trusted for identity — only a verified JWT.
function extractToken(req) {
  if (req.cookies?.[ADMIN_COOKIE_NAME]) return req.cookies[ADMIN_COOKIE_NAME];
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  return null;
}

// 1) read the credential, 2) validate/verify the JWT, 3) look up the
// authenticated admin, 4) attach it to the request — docs/CLAUDE.md Phase 6
// §7. Rejects with 401 for anything short of a currently-valid, currently-
// active admin; it never reports which specific check failed, so an invalid
// signature, an expired token, and a deleted/disabled account are all
// indistinguishable to the caller.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw new ApiError(401, 'Authentication required.');
  }

  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired session.');
  }

  const admin = await getActiveAdminById(payload.sub);
  if (!admin) {
    throw new ApiError(401, 'Invalid or expired session.');
  }

  req.admin = toAdminSummary(admin);
  next();
});

// Restricts a route to one or more of the approved admin roles
// (docs/CLAUDE.md Phase 6 §4). Must run after requireAuth.
export function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!req.admin) {
      next(new ApiError(401, 'Authentication required.'));
      return;
    }
    if (!roles.includes(req.admin.role)) {
      next(new ApiError(403, 'You do not have permission to perform this action.'));
      return;
    }
    next();
  };
}

// Country-scoped authorization foundation for future CMS routes
// (docs/CLAUDE.md Phase 6 §9). SUPER_ADMIN and INTERNATIONAL_ADMIN pass
// through unrestricted; a COUNTRY_ADMIN may only proceed when the route's
// target country matches their own assigned country.
//
// `resolveCountryId(req)` must resolve the target country from a trusted
// server-side lookup (e.g. resolving a :country slug against the database),
// never by trusting a client-submitted country id directly — the caller is
// responsible for that lookup; this middleware only compares the result
// against the authenticated admin's own assigned country.
export function requireCountryAccess(resolveCountryId) {
  return asyncHandler(async function checkCountryAccess(req, res, next) {
    if (!req.admin) {
      throw new ApiError(401, 'Authentication required.');
    }
    if (['SUPER_ADMIN', 'INTERNATIONAL_ADMIN'].includes(req.admin.role)) {
      next();
      return;
    }
    if (req.admin.role !== 'COUNTRY_ADMIN') {
      throw new ApiError(403, 'You do not have permission to perform this action.');
    }

    const targetCountryId = await resolveCountryId(req);
    if (!targetCountryId || targetCountryId !== req.admin.country?.id) {
      throw new ApiError(403, 'You are not authorized to manage this country.');
    }
    next();
  });
}

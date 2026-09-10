import { env } from './env.js';

// The JWT is delivered as an httpOnly cookie rather than a token the frontend
// stores itself (localStorage/sessionStorage) — since client-side JS can
// never read an httpOnly cookie, a successful XSS injection on the admin
// frontend cannot exfiltrate the session token. This is the "carefully
// consider XSS/security implications" call from docs/CLAUDE.md Phase 6 §6.
export const ADMIN_COOKIE_NAME = 'wwm_admin_token';

// One day, matching the default JWT_EXPIRES_IN — if JWT_EXPIRES_IN is
// changed, update this to match so the cookie doesn't outlive (or expire
// before) the token it carries.
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function baseCookieOptions() {
  const isProduction = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    // Cross-site cookies (frontend and backend deployed to different
    // origins, as Phase 6 §18's separate client/server Vercel projects will
    // be) require SameSite=None + Secure. Local development keeps SameSite=
    // Lax over plain HTTP, which browsers still send on same-site
    // cross-port XHR/fetch requests (Vite dev server -> Express dev server).
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
}

export function adminCookieOptions() {
  return { ...baseCookieOptions(), maxAge: COOKIE_MAX_AGE_MS };
}

// Deliberately omits `maxAge`: express's res.clearCookie() sets Expires to
// the epoch to force immediate deletion, but per the cookie spec a Max-Age
// present alongside it takes precedence — passing adminCookieOptions()'s
// maxAge here would make logout silently keep the cookie alive for another
// full day instead of clearing it. Must still match httpOnly/secure/
// sameSite/path exactly, or the browser won't recognize it as the same
// cookie to delete.
export function adminClearCookieOptions() {
  return baseCookieOptions();
}

// VITE_API_URL is baked into the bundle at build time. If it is missing, the
// client falls back to http://localhost:5000/api, which would silently ship a
// site whose every request points at the visitor's own machine. vite.config.js
// calls this on Vercel builds (VERCEL is set by the platform) and refuses to
// build when it returns a problem. Local builds are unaffected. Everything
// prefixed VITE_ is public: never put a secret in it.
//
// Dependency-free on purpose: the server's test suite imports this same file.
export function checkProductionApiUrl(apiUrl) {
  if (!apiUrl) {
    return 'VITE_API_URL is not set. Set it in the Vercel project (Settings -> Environment Variables) to the deployed API base URL including /api, e.g. https://your-api.vercel.app/api';
  }
  if (/\/\/(localhost|127\.0\.0\.1|\[::1\])([:/]|$)/i.test(apiUrl)) {
    return `VITE_API_URL points at a local address (${apiUrl}). Use the deployed API base URL.`;
  }
  if (!/^https:\/\//i.test(apiUrl)) {
    return `VITE_API_URL must be an https:// URL in production (got ${apiUrl}).`;
  }
  return null;
}

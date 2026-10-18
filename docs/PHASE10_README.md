# Phase 10 — Production Polish, Security & Deployment Readiness

**Status:** code-level hardening implemented and tested. **Not** production-verified: nothing here was run against live MongoDB, Cloudinary, Vercel or the real domains.

## 1. Audit summary
Phase 9 is present on `main` (commit `13de922`). Baseline before changes: 96/96 server tests, clean client build, 0 dependency vulnerabilities.

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | High | No `trust proxy`: behind Vercel all clients share one rate-limit bucket (login: 10 attempts / 15 min locks out every admin) | Fixed (`TRUST_PROXY`, defaults to 1 on Vercel) |
| 2 | High | Error handler returned `err.message` on 500s; Mongoose/DB/JSON errors surfaced as 500 with internal text | Fixed (central translation, generic 5xx, 400/409/413/503 mapping) |
| 3 | High | `?search[a]=b` crashed (500); `?country[$ne]=x` / repeated params reached Mongo filters | Fixed (simple query parser + array rejection) |
| 4 | Medium | No DB timeouts, no graceful shutdown, failed first connect never retried | Fixed |
| 5 | Medium | `connectDB()` returned early while a connect was in flight | Fixed (shared promise) |
| 6 | Medium | Expired admin session not handled in the UI | Fixed (401 interceptor → sign-in page with notice) |
| 7 | Medium | No request timeouts; no error boundary | Fixed |
| 8 | Medium | One 482 kB bundle incl. admin code; `/auth/me` called by every public visitor | Fixed (lazy admin chunk; session check only under `/admin`) |
| 9 | Medium | Login timing revealed registered emails; "disabled" revealed before the password was checked | Fixed |
| 10 | Medium | No Origin check on state-changing admin/auth requests (cookie is `SameSite=None` in production) | Fixed (defence in depth; CORS preflight already blocked cross-site JSON) |
| 11 | Medium | No skip-to-content link | Fixed |
| 12 | Medium | Production silently fell back to localhost for `MONGODB_URI`/`CLIENT_ORIGIN`; single CORS origin; admin responses cacheable | Fixed |
| 13–16 | Low | JWT algorithm not pinned / no length check; noisy 4xx logs; no readiness endpoint; no robots/noindex | Fixed |
| 17–18 | Low | Stale `CLAUDE.md` line; `wwm-phase9-media.zip` committed at repo root | Doc fixed; **you should `git rm wwm-phase9-media.zip`** |

**Already satisfactory (unchanged):** auth middleware re-checks the DB on every request; server-side country scoping; field whitelists; 409 on deleting referenced records; httpOnly + Secure cookie; indexes match queries; pagination capped (max 100); upload validation and Cloudinary secret handling (Phase 9); 0 `npm audit` findings.

## 2. Changes
**Server**
- `config/env.js`: production requires `MONGODB_URI` and `CLIENT_ORIGIN`; `CLIENT_ORIGIN` may be a comma list, never `*`; `TRUST_PROXY`; warns on a short `JWT_SECRET` or partial Cloudinary config.
- `app.js`: `trust proxy`, simple query parser, explicit CORS allowlist, 100 kb JSON limit, query guard, Origin check + `Cache-Control: no-store` on `/api/auth` and `/api/admin`.
- `middleware/security.js` (new), `middleware/errorHandler.js` (rewritten).
- `config/db.js`: shared in-flight connect, `serverSelectionTimeoutMS`/`bufferTimeoutMS` = 5 s, `disconnectDB`.
- `index.js`: background reconnect, `SIGTERM`/`SIGINT` graceful shutdown (10 s force-exit), listen-error exit, unhandled-rejection log.
- `routes/health.js`: `/api/health` (liveness, always 200) and new `/api/health/ready` (503 when MongoDB is not connected).
- `services/authService.js`: HS256 pinned on sign and verify; constant-work login; password checked before the disabled flag.

**Client**
- `services/api.js`, `services/authApi.js`: 15 s timeouts; 401 interceptor (login/me/logout excluded).
- `context/AuthContext.jsx`: session check only on `/admin` paths; `sessionExpired` flag. `pages/admin/AdminLogin.jsx` shows the notice.
- `components/ui/ErrorBoundary.jsx`, `main.jsx`; `AdminRoutes.jsx` + `App.jsx` (lazy admin chunk, admin 404 inside the shell, admin `noindex`).
- Skip links in `Layout.jsx` and `AdminLayout.jsx`; `public/robots.txt` (disallows `/admin`).
- `client/vercel.json`: security headers + immutable asset caching.

**Config/docs:** `server/.env.example`, `client/.env.example`, `CLAUDE.md`, `docs/PROGRESS.md`, this file.

## 3. Tests actually run
| Check | Result |
|---|---|
| `cd server && npm test` | **132 tests, 132 pass** (96 existing + 36 new) |
| New tests run against the *pre-Phase-10* sources | 20 failures plus one suite that could not load, i.e. they detect the defects |
| `cd client && npm run build` | passes; main JS 482.5 kB → 388.7 kB (gzip 133 → 117 kB); admin lazy chunk 97 kB |
| `cd client && npx oxlint` | 0 errors; only the previously accepted `set-state-in-effect` warnings |
| `npm audit --omit=dev` (server, client) | 0 vulnerabilities |
| Headless Chromium vs. production build + mock API | 23/23 checks (see PROGRESS.md) |

New tests cover: generic 5xx; 400/409/413/503 mapping; no stack/DB detail leaks; ApiError 5xx still shown; array/operator query values; Origin check and CORS; no-store and helmet headers; login equalisation and disabled-account ordering; JWT alg/expiry/deleted-user; health/ready; connect sharing and timeouts; production env validation (child process); per-IP rate limiting behind a proxy.

## 4. Environment variables
Server (`server/.env.example`): `NODE_ENV=production`, `MONGODB_URI` (required), `CLIENT_ORIGIN` (required; comma list allowed), `JWT_SECRET` (required, ≥ 32 random chars), `JWT_EXPIRES_IN` (default 1d; keep the cookie lifetime in `config/auth.js` in step), `TRUST_PROXY` (optional), `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` (optional; all three or none), `MEDIA_MAX_UPLOAD_MB` (≤ 4 on Vercel), `PUBLIC_SUBMISSION_LIMIT` (optional), seed-only `ADMIN_SEED_*`.
Client: `VITE_API_URL` = `https://<api-host>/api` (baked in at build time).

## 5. Deployment (two Vercel projects)
1. **API project** — root directory `server`; uses `server/vercel.json` and `api/index.js`. Set the server variables above in Project Settings → Environment Variables (Production).
2. **Web project** — root directory `client`; build `npm run build`, output `dist`; set `VITE_API_URL`.
3. Set the API's `CLIENT_ORIGIN` to the web project's exact production origin (and any alias), then redeploy.
4. MongoDB Atlas: create a dedicated database user with least privilege; Network Access must allow Vercel's egress (Vercel has no fixed IPs on standard plans, so Atlas typically needs `0.0.0.0/0` — keep the credentials strong and the user scoped to the `wwm` database).
5. Create the first admin once: set `ADMIN_SEED_*` locally against the production URI and run `npm run seed:admin` (never commit those values).
6. Domains/HTTPS: attach custom domains in Vercel (HTTPS is automatic). **Cross-site cookie note:** if the web and API are on different registrable domains (e.g. `*.vercel.app` pairs) the admin cookie is third-party (`SameSite=None`); browsers that block third-party cookies (Safari, some Chrome modes) will fail to keep the admin signed in. Prefer subdomains of one custom domain (`www.example.org` + `api.example.org`) and test.
7. Delete `wwm-phase9-media.zip` from the repo root.

## 6. Manual checks still required (not done here)
- `GET /api/health/ready` returns 200 on the deployed API; point an uptime monitor at it.
- Sign in on the real domain; confirm the cookie is set (`Secure`, `HttpOnly`, `SameSite=None`) and survives a reload, in Chrome **and** Safari.
- Wrong origin is refused: `curl -X POST -H 'Origin: https://evil.example' …/api/auth/login` → 403.
- Rate limiting by real client IP: > 10 bad logins from one network returns 429 while another network is unaffected (confirms `TRUST_PROXY`).
- Cloudinary: set the three variables, upload an image from a News form, check it displays publicly, replace it, and confirm the old asset disappears from the Cloudinary console.
- Stop/limit MongoDB access briefly in a staging copy and confirm data routes answer 503 with the friendly message and recover.
- Walk every admin module once as each role, including a `COUNTRY_ADMIN` attempting another country's record.
- Backups: enable Atlas continuous/cloud backups (paid tiers) or schedule `mongodump`; test a restore into a scratch cluster.
- Logging: Vercel function logs show `[error]` lines for 5xx; consider alerting on them. No request bodies or secrets are logged.

## 7. Known limitations and residual risks
- Rate limiters are in-memory: limits apply per serverless instance, not globally. A shared store (e.g. Redis/Upstash) would be needed for strict limits; deliberately not added.
- Logout clears the cookie but cannot revoke an already-issued JWT before its expiry (default 1 day). Changing `JWT_SECRET` revokes all sessions.
- No Content-Security-Policy on the client host: the correct policy depends on the final API/Cloudinary origins; add after the domains are fixed.
- Uploaded-but-never-attached Cloudinary images are not swept (Phase 9 limitation).
- The error boundary and the admin forms were not exercised against a real API in a browser; the smoke test used a mock API.
- Give (Phase 8) remains an honest placeholder pending a payment-provider decision; no sitemap was generated (needs the final domain).
- Public pages still use mostly a single main chunk (389 kB); further splitting was judged not worthwhile without field data.

## 8. Readiness assessment
1. **Automated checks:** passing (132/132 server tests, build, lint, 0 audit findings).
2. **Security review:** code review complete; no known Critical/High issues open. Residual risks listed above. Not penetration-tested.
3. **Local integration verification:** partial — real HTTP against the real Express app with mocked models, plus a browser smoke test against a mock API. No real MongoDB.
4. **Production configuration:** prepared (env validation, examples, Vercel headers, deployment steps) but unverified on the actual projects.
5. **Live deployment verification:** **not done.**

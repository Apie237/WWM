# Deploying WWMI to Vercel

Two Vercel projects, one GitHub repository (`Apie237/WWM`, branch `main`):

| | Frontend (`wwm-web`) | Backend (`wwm-api`) |
|---|---|---|
| Root Directory | `client` | `server` |
| Framework Preset | Vite | Other |
| Build Command | `npm run build` | leave default (the `builds` entry in `server/vercel.json` applies) |
| Output Directory | `dist` | leave default |
| Install Command | default (`npm install`) | default |
| Entry | static `index.html` + SPA fallback rewrite (`client/vercel.json`) | `server/api/index.js` → `@vercel/node`; every path is rewritten to it with the original URL (`server/vercel.json`) |
| Production branch | `main` | `main` |

The project names are your choice; each project's production address is `https://<project-name>.vercel.app`.

> Status: this file describes configuration that is verified **locally and with mocks** (see "What was and was not verified"). Nothing has been deployed or checked against Vercel, Atlas or a real browser by the author of this guide.

## 1. Environment variables (names only — enter values in the Vercel dashboard)

Never put a secret in a `VITE_` variable: everything with that prefix is public in the browser bundle. Never commit `.env` files.

**Backend project (`wwm-api`) → Settings → Environment Variables (Production, and Preview if you use previews)**

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | The Atlas connection string, ending in the database name `WWM-INT'L`. Copy exactly the value that works in your local `server/.env`; do not retype it. If Vercel mangles the apostrophe, write it as `%27`. |
| `JWT_SECRET` | yes | A long random value (32+ characters), different from any development value. |
| `CLIENT_ORIGIN` | yes | The frontend's exact origin, e.g. `https://wwm-web.vercel.app` — scheme + host, no path, never `*`. Several origins: comma-separated. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | only for image uploads | All three or none. Without them the admin upload control reports "not configured" and the rest of the site works. Server-side only. |
| `JWT_EXPIRES_IN` | no | Default `1d` (keep it equal to the cookie lifetime, one day). |
| `TRUST_PROXY` | no | Leave unset: it defaults to 1 on Vercel, which is correct. |
| `MEDIA_MAX_UPLOAD_MB` | no | Default 4; keep it ≤ 4 (Vercel's request-body limit is about 4.5 MB). |
| `PUBLIC_SUBMISSION_LIMIT` | no | Default 5 prayer-request/contact submissions per IP per hour. |

Do **not** set `ADMIN_SEED_*`, `ADMIN_RESET_PASSWORD` or `ADMIN_CHECK_PASSWORD` on Vercel; they are only for local, deliberate admin scripts. `NODE_ENV` and `VERCEL` are set by the platform. There is no email or other third-party integration in the code.

**Frontend project (`wwm-web`) → Environment Variables (Production **and** Preview)**

| Variable | Required | Value |
|---|---|---|
| `VITE_API_URL` | yes | The backend's base URL **including `/api`**, e.g. `https://wwm-api.vercel.app/api`. It is baked in at build time, so changing it needs a redeploy. |

The frontend build **fails on Vercel** if `VITE_API_URL` is missing, points at `localhost`, or is not `https://` (`client/deploy/checkApiUrl.js`), instead of silently shipping a site that calls the visitor's own machine. Local builds are not affected.

## 2. Order of steps

1. **MongoDB Atlas → Network Access:** allow connections from Vercel. Vercel functions have no fixed IP on the free plan, so this normally means `0.0.0.0/0` (protected by the database user's strong password) or Vercel's Atlas integration. Without this the API starts but `/api/health/ready` stays 503.
2. **Create the backend project** (Add New → Project → import `Apie237/WWM`, Root Directory `server`). Add `MONGODB_URI`, `JWT_SECRET` and (optionally) the Cloudinary variables. Put your planned frontend address in `CLIENT_ORIGIN`. Deploy.
3. **Create the frontend project** (Root Directory `client`, framework Vite). Set `VITE_API_URL` to the backend's address + `/api`. Deploy.
4. **Make the two agree:** if the frontend's address differs from what you put in `CLIENT_ORIGIN`, correct it in the backend project and **redeploy the backend** (environment-variable changes only apply to new deployments).
5. Run the checks in section 3.

Do **not** run `seed:*` scripts against production as part of deployment. The database `WWM-INT'L` already holds the administrator and the 15 published History entries; the production API only has to use the same database.

## 3. Checks after deployment (replace the two addresses)

```
API=https://wwm-api.vercel.app
WEB=https://wwm-web.vercel.app

curl -s  $API/api/health                      # {"status":"ok",...}
curl -si $API/api/health/ready | head -1      # HTTP/2 200  (503 = database unreachable: check Atlas Network Access and MONGODB_URI)
curl -s  "$API/api/history?limit=200" | head -c 300     # "pagination":{"total":15,...} proves the right database is used
curl -si $API/api/admin/history | head -1     # HTTP/2 401  (admin is protected)

# CORS: the frontend origin is allowed, any other is not
curl -si -X OPTIONS $API/api/auth/login -H "Origin: $WEB" -H "Access-Control-Request-Method: POST" | grep -i "^access-control-allow-origin"
curl -si -X OPTIONS $API/api/auth/login -H "Origin: https://evil.example" -H "Access-Control-Request-Method: POST" | grep -ci "^access-control-allow-origin"   # 0
```

Then in a browser: open `$WEB/history` (the 15 entries), open `$WEB/admin/login` directly (no 404), sign in, open Admin → History, and in the Network tab confirm no request goes to `localhost`.

## 4. Known risks and decisions for you

1. **Cross-site cookie (the most likely real-world problem).** The admin session is an `httpOnly`, `Secure`, `SameSite=None` cookie set by the API. If the site and the API are on different registrable domains — for example `wwm-web.vercel.app` and `wwm-api.vercel.app` (`vercel.app` is on the Public Suffix List, so these are different *sites*) — browsers that block third-party cookies (Safari by default, Firefox/Brave strict modes, Chrome Incognito) can refuse the cookie, and sign-in will appear to succeed and then bounce back to the login page. **Recommended fix: use a custom domain with two subdomains** (`www.<your-domain>` for the frontend, `api.<your-domain>` for the backend). Then set `CLIENT_ORIGIN=https://www.<your-domain>` and `VITE_API_URL=https://api.<your-domain>/api`; the cookie is then first-party and no code change is needed. A `/api` rewrite in the frontend project would also avoid it, but the backend would then see Vercel's proxy rather than the visitor's IP, which breaks the per-IP rate limits (login is limited to 10 attempts per 15 minutes), so it is not recommended without testing. This was **not** tested in any browser.
2. **Rate limits are in memory,** per serverless instance, so they are a speed bump rather than a strict global limit.
3. **Logout does not revoke an already-issued token** (valid until it expires, one day by default).
4. **Preview deployments** have different addresses. They can only reach the API if their origin is added to `CLIENT_ORIGIN` (comma-separated); otherwise they are blocked by design. Set `VITE_API_URL` for Preview too, or Preview builds will fail the guard.
5. **Cold starts / region.** The first request after idle connects to Atlas (up to about 5 s). Pick the Vercel function region closest to your Atlas cluster (Settings → Functions).
6. **Stray archives in the repository:** `wwm-admin-access.zip` and `wwm-history-section.zip` sit at the repository root. They are not deployed (each project has its own root directory) but do not belong in Git: `git rm wwm-admin-access.zip wwm-history-section.zip`.
7. The backend uses the legacy `builds` key in `server/vercel.json`; Vercel then ignores the dashboard's Build/Output settings for that project and shows a notice. That is expected, not an error.

## 5. What was and was not verified (by the author of this guide)

Verified locally: server tests; client production build; `npm audit` (0 vulnerabilities in both packages); the real `server/api/index.js` loaded in production mode (`NODE_ENV=production`, `VERCEL=1`) behind a Node HTTP server with an unreachable database — liveness 200, readiness 503, generic 503 on data routes, `trust proxy` = 1, production-only CORS origin, foreign origin refused, admin routes 401 and `no-store`; production cookie attributes; both `vercel.json` files; the build guard for `VITE_API_URL`.

**Not verified:** Vercel's own runtime and packaging of the function (`@vercel/node`), any Vercel dashboard setting, MongoDB Atlas connectivity from Vercel, DNS/HTTPS, a real browser against the deployed pair (including the third-party-cookie behaviour above), Cloudinary, and the production History/admin flows. No deployment was performed from the author's environment, because no Vercel access (CLI, token, network route or connector with deploy rights) was available there.

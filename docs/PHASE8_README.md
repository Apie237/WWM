# Phase 8 merge notes — Remaining Public Modules

Delivered: News, Events, Resources, Prayer Requests, Contact (public pages, public API, forms) plus minimal admin management. **Give is not implemented** (no payment provider/verified giving details supplied). Existing Missionaries/leadership/directory features were reused unchanged.

## Merge
Extract so the contents of `wwm/` land on your project root (see the unzip one-liner given in chat), then:
```
cd server && npm install && npm test      # expect 56 passing
cd ../client && npm install && npm run build
```
No dependency or lockfile changes. Review with `git status`/`git diff`; commit and push yourself.

## Database / environment
- **New MongoDB collections** (created automatically by Mongoose on first write): `news`, `events`, `resources`, `prayerrequests`, `contactmessages`. No existing collection is changed; no seed data.
- **New optional env var**: `PUBLIC_SUBMISSION_LIMIT` (server; default 5 prayer/contact submissions per IP per hour). No other env changes.
- Behind a reverse proxy, set Express `trust proxy` at deployment so rate limiting sees real client IPs.

## Try it
1. Admin → News / Events / Resources → create items with status **Published**; they appear on `/resources`, `/news`, `/events`, and (when a country is set) on that country's page under News & Events.
2. Submit a prayer request on `/resources#prayer-requests` → Admin → Prayer Requests → Approve; it then appears publicly.
3. Submit the Contact form → Admin → Contact Messages (SUPER_ADMIN / INTERNATIONAL_ADMIN only).

## Roles
News/Events: all read; COUNTRY_ADMIN limited to own country. Resources: COUNTRY_ADMIN read-only. Prayer Requests: SUPER/INTERNATIONAL/COUNTRY (own country). Contact Messages: SUPER/INTERNATIONAL only.

See `docs/PROGRESS.md` (Phase 8 record) for verification results and limitations.

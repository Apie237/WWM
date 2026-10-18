# World Wide Missions — Claude Development Rules

## Project

World Wide Missions International (WWMI) is a professional global mission organization platform consisting of:

1. A public-facing international mission website.
2. A database-driven international organizational directory.
3. A secure administration/CMS platform.

The project must follow the architecture and requirements defined in:

docs/PROJECT_SPEC.md

The visual/UI/UX direction is defined in:

docs/DESIGN_SPEC.md

Development progress is tracked in:

docs/PROGRESS.md

These documents must be read before implementing major features.

---

## Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React

### Backend

- Node.js
- Express
- MongoDB
- Mongoose

### Future infrastructure

- JWT authentication
- bcrypt password hashing
- Cloudinary media management

---

## Architecture Rules

- Follow docs/PROJECT_SPEC.md as the authoritative architecture specification.
- Follow docs/DESIGN_SPEC.md for visual/UI/UX decisions.
- Use reusable components.
- Do not create country-specific React pages.
- Country pages must use one reusable database-driven template.
- Use separate Continent and Country models.
- Use one Person model for all people.
- Use one generic Organization model for churches and institutions.
- CountryAdministration must be its own model.
- AffiliatePastorsBoard must be its own model.
- History must be represented as structured data.
- Organizational data must live in the database rather than being hardcoded into JSX.
- Backend should follow Routes → Controllers → Services → Models.
- Keep frontend and backend responsibilities separated.

---

## Data Integrity

- Never invent World Wide Missions organizational facts.
- Never invent historical dates, leaders, churches, institutions, countries, statistics, or other organizational information.
- If information is unavailable, use clearly identified placeholder/demo data where appropriate.
- Preserve uncertainty when historical information is conflicting or approximate.
- Historical information must be clearly distinguished from current organizational information.
- Historical addresses must never be presented as current addresses unless explicitly verified.

---

## Development Process

Development is strictly phase-based.

The current phase must be checked in:

docs/PROGRESS.md

Only implement the phase explicitly requested.

Do NOT silently implement future phases.

Before making changes:

1. Read docs/PROJECT_SPEC.md.
2. Read docs/DESIGN_SPEC.md when the work involves frontend/UI/UX.
3. Read docs/PROGRESS.md.
4. Inspect the existing codebase.
5. Determine what already exists.
6. Preserve working functionality.

After making changes:

1. Run appropriate verification.
2. Fix errors discovered during verification.
3. Update docs/PROGRESS.md only when the phase or documented milestone has actually been completed and verified.
4. Clearly report what changed.
5. Do not proceed automatically to the next phase.

---

## Code Quality

- Prefer simple, maintainable solutions.
- Avoid unnecessary abstraction.
- Avoid premature optimization.
- Keep files reasonably sized and organized.
- Reuse components and services instead of duplicating logic.
- Follow existing project conventions unless there is a documented reason to change them.
- Do not rewrite working code unnecessarily.
- Do not delete functionality without justification.

---

## Frontend Rules

- Use React components and reusable templates.
- Use Tailwind CSS consistently with the approved WWM design system.
- Follow docs/DESIGN_SPEC.md.
- Maintain responsive/mobile-first behavior.
- Do not hardcode organizational content into components.
- Use semantic HTML.
- Maintain accessible keyboard navigation and focus states.
- Provide appropriate loading, error, and empty states.
- Avoid excessive animation, gradients, shadows, and rounded cards.
- Preserve the professional, institutional, Christian, international WWM visual identity.

---

## Backend Rules

- Follow Routes → Controllers → Services → Models.
- Keep controllers thin.
- Put business logic in services.
- Keep Mongoose schemas focused on data structure and validation.
- Use centralized error handling.
- Validate incoming data.
- Use environment variables for secrets/configuration.
- Never expose secrets to the frontend.
- Enforce authorization server-side when authentication is implemented.

---

## Security Rules

- Never commit secrets, API keys, passwords, or private credentials.
- Never expose server-only environment variables to the frontend.
- Do not trust frontend role checks as a security boundary.
- Authentication and authorization must eventually be enforced server-side.
- Passwords must be securely hashed with bcrypt.
- Follow the security requirements in docs/PROJECT_SPEC.md.

---

## Database Rules

- Use Mongoose.
- Add appropriate validation.
- Add appropriate indexes where justified.
- Maintain referential integrity at the application/service level where MongoDB does not enforce it.
- Avoid unnecessary duplication of person or organizational data.
- Use references between related entities where appropriate.
- Do not create duplicate models when an existing reusable model is specified by PROJECT_SPEC.md.

---

## Country Architecture

Country pages must always remain database-driven.

Never create:

- CameroonPage.jsx
- UgandaPage.jsx
- KenyaPage.jsx
- etc.

Instead use one reusable country template, for example:

CountryPage.jsx

The country is determined from the route and API/database data.

The same principle applies to:

- Country Administration
- WWM Pastors
- Affiliate Pastors
- Churches
- Institutions
- Missionaries
- Ministries
- News
- Events
- History

---

## Media

Cloudinary image uploads were implemented in Phase 9 (signed REST API, no SDK, no Media model; see docs/PHASE9_README.md). Documents/PDF uploads and any broader media library are not implemented and need explicit instruction.

---

## Git

Before making major changes:

- Inspect the current Git state.
- Do not overwrite unrelated work.
- Do not reset or delete commits unless explicitly instructed.
- Keep commits focused by phase or feature.

After a verified phase is complete, recommend a Git commit with a clear message.

---

## Documentation

The following documents are project source-of-truth documents:

docs/PROJECT_SPEC.md
docs/DESIGN_SPEC.md
docs/PROGRESS.md

When architecture or approved requirements change:

1. Update the appropriate specification first.
2. Then implement the change.
3. Keep the documentation and code consistent.

Never silently change the architecture in code without updating the relevant specification.

---

## Scope Control

If a requested feature belongs to a future phase:

- Do not implement it automatically.
- Explain that it belongs to a future phase.
- Only implement it if explicitly requested.

Do not add unrelated features simply because they may be useful.

---

## Current Project Status

Phase 1 — Project Scaffolding: COMPLETED.

Phase 2 — Core Data Models: COMPLETED.

Phase 3 — Public API: COMPLETED.

Phase 4 — Public Website + Design System: COMPLETED.

Phase 5 — Mission Locations: COMPLETED.

Phase 6 — Authentication + Admin Foundation: COMPLETED.

Phase 7 — CMS CRUD: COMPLETED.

Phase 8 — Remaining Public Modules: IMPLEMENTED EXCEPT "Give" (awaiting owner decision on a payment provider/verified giving details). See docs/PROGRESS.md.

Phase 9 — Media / Cloudinary: IMPLEMENTED for images on News, Events, People and Country flags (live Cloudinary not verified; see docs/PROGRESS.md).

Phase 10 — Production Polish: CODE-LEVEL HARDENING IMPLEMENTED (not production-verified; live MongoDB/Cloudinary/Vercel checks still required — see docs/PHASE10_README.md and docs/PROGRESS.md).

**Phase 5 status note**: implemented the full database-driven Mission Locations hierarchy — `/mission-locations/:continent` (`ContinentPage`) and `/mission-locations/:continent/:country` (the one reusable `CountryPage` template, per the Country Architecture rule below). Country pages use the six-group section navigation (Overview, Leadership, Churches & Institutions, Missionaries & Ministries, News & Events, Contact), a new data-driven `LeadershipChart` shared by Country Administration and the Affiliate Pastors Board, and reuse of Phase 4's `DirectorySearch`/`OrganizationCard`/`PersonCard`. No backend changes were required — the existing Phase 3 public API already supported every query Phase 5 needed. See `docs/PROGRESS.md` for the full completion record (routes, components, verification, deferred items).

**Phase 6 status note**: JWT authentication (httpOnly cookie, Bearer header also accepted), bcrypt password hashing, the `User` model, and the four approved admin roles (`SUPER_ADMIN`, `INTERNATIONAL_ADMIN`, `COUNTRY_ADMIN`, `CONTENT_EDITOR`) are implemented, along with `requireAuth`/`requireRole`/`requireCountryAccess` middleware, `/api/auth/*` and `/api/admin/dashboard` routes, an admin seed script, and a full admin frontend foundation. No CMS CRUD existed yet as of Phase 6 — the admin dashboard was a verified shell only. See `docs/PROGRESS.md` for the full completion record.

**Phase 7 status note**: implemented full list/view/create/edit/delete/search/filter/pagination CRUD for all eight approved modules (Continents, Countries, People, Country Administration, Affiliate Pastors Boards, Churches, Institutions, Ministries — the last two both via the single `Organization` model, per the Country Architecture rule). Backend: seven new admin route/controller/service module groups under `server/src/{routes,controllers,services}/admin/`, following Routes → Controllers → Services → Models throughout, plus a shared `utils/adminHelpers.js`; every write whitelists fields and validates references, every delete with an incoming reference is blocked with a 409 rather than cascading, and `COUNTRY_ADMIN` scoping is enforced server-side from the verified JWT only. Frontend: a new `services/adminApi.js` client, a shared `components/admin/cms/` primitive set, and 8 modules' worth of list+form admin pages (Country Administration and Affiliate Pastors Board share one parameterized page-factory, since the two backend models are structurally identical). No Phase 2 models were changed. See `docs/PROGRESS.md` for the full completion record (authorization matrix, verification performed, and the known limitation that no reachable MongoDB was available in that session for DB-backed verification).

All ten planned phases have now been worked. Do not add new features or begin further phases unless explicitly instructed; the remaining work is the manual deployment verification listed in docs/PHASE10_README.md and the pending Give module (Phase 8).

---

## Final Rule

When uncertain about an architectural decision:

1. Check docs/PROJECT_SPEC.md.
2. Check docs/DESIGN_SPEC.md.
3. Check docs/PROGRESS.md.
4. Inspect the existing implementation.
5. If the decision remains ambiguous, stop and ask rather than inventing an architectural direction.

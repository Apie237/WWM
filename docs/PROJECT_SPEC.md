# World Wide Missions International (WWMI) — Project Specification

This document is the authoritative architecture and requirements reference for the World Wide Missions International (WWMI) platform. It supersedes ad-hoc chat instructions where there is a conflict. Update this file when the approved architecture changes; do not silently drift from it during implementation.

Companion file: `docs/PROGRESS.md` tracks phase completion status. This file defines *what* is being built; `PROGRESS.md` tracks *how far* the build has gotten.

---

## 1. Project Purpose

Build a professional global mission organization platform consisting of three parts:

1. A public-facing international mission website.
2. A structured, database-driven international mission directory (continents → countries → country-level organizational and ministry data).
3. A secure administration/CMS platform for managing organizational information and content.

---

## 2. Technology Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React

**Backend**
- Node.js
- Express
- MongoDB
- Mongoose

**Infrastructure / future services**
- Cloudinary for media management (Phase 9)
- JWT authentication (Phase 6)
- bcrypt for password hashing (Phase 6)

---

## 3. System Architecture — Three Logical Areas

1. **Public Website** — informational, read-only, public-facing.
2. **International Organizational Directory** — the database-driven continent/country/organization/person data that powers both the public website and the CMS.
3. **Admin/CMS Platform** — authenticated, role-restricted management of the directory and site content.

### Backend layering

Requests flow through a layered architecture with separated responsibilities:

```
Routes → Controllers → Services → Models
```

- **Routes** define URL paths and HTTP verbs only.
- **Controllers** parse requests and shape responses.
- **Services** contain business logic and orchestrate model access.
- **Models** define Mongoose schemas and data access.

Centralized error handling and environment-variable-based configuration apply across all layers (established in Phase 1).

### Frontend architecture

- Reusable components and page templates only.
- No per-country React implementations. Country pages render from one reusable template (e.g. `CountryPage.jsx`) driven by route parameters and API data.
- Content and organizational data live in the database, not hardcoded in JSX.

---

## 4. Public Website Structure

Top-level sections:

- Home
- About Us
- Missions
- Mission Locations
- Church Institutions
- Non-Church Institutions
- Missionaries
- News & Events
- Resources
- Prayer Requests
- Give
- Contact

### About Us subsections

- Who We Are
- Mission
- Vision
- Values
- Beliefs
- Purpose
- Our Approach (includes National Leadership philosophy — see §9)
- National Leadership
- Our History
- International Administration
- Legal & Organizational Information

---

## 5. Information Architecture — Mission Locations

Hierarchy:

```
World Wide Missions
 → Continents
    → Countries
       → Country information
```

Example routes:

```
/mission-locations
/mission-locations/africa
/mission-locations/africa/cameroon
```

Country pages must be database-driven and reusable — one template, many countries, rendered from API data keyed by route params.

A country page should be capable of displaying:

- Country Overview
- History of the Mission Field
- Country Administration
- WWM Pastors
- Affiliate Pastors
- Churches
- Institutions
- Missionaries
- Ministries
- News
- Events
- Contact Information

---

## 6. Database Architecture

### Core data model rules (non-negotiable)

1. Use separate `Continent` and `Country` models — do **not** create a generic self-referencing `Location` model.
2. Use **one** `Person` model for all people throughout the organization.
3. People have roles/statuses rather than dedicated collections per role (no separate `Pastor`, `Founder`, `Missionary`, etc. collections).
4. Use a generic `Organization` model for churches and institutions.
5. `Organization` type/category distinguishes:
   - WWM Church
   - School
   - Hospital
   - Clinic
   - Orphanage
   - Bible College
   - Training Center
   - Community Project
   - Other
6. `CountryAdministration` is its own model.
7. `AffiliatePastorsBoard` is its own model.
8. History is represented as structured data (`HistoryEvent` records), never hardcoded into React components.
9. Organizational facts must not be invented — see §14, "Do Not Invent Organizational Data."

### Core models (Phase 2)

- `Continent`
- `Country`
- `Person`
- `Organization`
- `Ministry`
- `CountryAdministration`
- `AffiliatePastorsBoard`

### Content models (later phases)

- `HistoryEvent`
- `News`
- `Event`
- `Resource`
- `PrayerRequest`
- `Document`
- `Media`
- `ContactMessage`

### Administration models

- `User`

---

## 7. Person Model Philosophy

One `Person` model represents everyone in the organization, historical or current, including but not limited to:

- Founder
- Missionary
- Pastor
- Superintendent
- Administrator
- Affiliate Pastor
- International Leader

Rules:

- A person may hold **multiple roles** (e.g. a Superintendent who is also a Missionary).
- The model must support both **historical** and **current** people — a person doesn't need to be presently active to exist in the system.
- Never create separate collections such as `Founder`, `Pastor`, or `Missionary`. Roles are data on `Person`, not schema-level distinctions.

---

## 8. Organization Model

One reusable `Organization` model covers:

- Churches
- Schools
- Hospitals
- Clinics
- Orphanages
- Bible Colleges
- Training Centers
- Community Projects
- Other institutions

Organizations are associated with a `Country` and, where appropriate, a region/city.

---

## 9. Location Hierarchy

- `Continent` and `Country` are distinct, explicit models — not nodes in a generic self-referencing tree.
- Country pages consume this hierarchy plus related `Organization`, `Person`, `Ministry`, `CountryAdministration`, and `AffiliatePastorsBoard` records to render country-specific content through the shared template.

---

## 10. Country Administration

`CountryAdministration` supports positions such as:

- Superintendent
- Assistant Superintendent
- Secretary
- Treasurer
- Missions Director
- Board Chairman
- Youth Director
- Women Director
- Executive Committee

Rules:

- Positions must **not** be hardcoded into React — the model must be flexible enough to accommodate future organizational changes without frontend code changes.
- `CountryAdministration` links to `Person` records (via role/position assignments) rather than duplicating person data.

---

## 11. Affiliate Pastors Board

`AffiliatePastorsBoard` supports:

- Chairman
- Vice Chairman
- Secretary
- Treasurer
- Public Relations Officer
- Regional Coordinators
- Affiliate Pastors

This board must be entirely database-driven, following the same "no hardcoded positions in the frontend" rule as Country Administration.

---

## 12. Historical Information Architecture

Historical information is stored as structured records (`HistoryEvent`), not prose baked into components.

### `HistoryEvent` fields

- `title`
- `description`
- `date` / `year`
- `approximateDate`
- `historical` (flag)
- people involved (references to `Person`)
- `location`
- `source` / reference notes
- display order

### Handling uncertainty

When dates or claims are uncertain or sources conflict, **preserve the uncertainty** — do not silently resolve it or present a best guess as settled fact. Use `approximateDate`, `historical`, and `notes`/`source` fields to carry that nuance into the data model itself.

### Supplied historical information (project-owner provided)

The following is what the project owner has supplied to date. It is treated as source material for seeding `HistoryEvent`/`Person` records in later phases — it is **not** implemented yet, and nothing beyond this should be invented or assumed.

**Rev. Bearl Darwin Smalldridge (1928–2016)**
- First missionary to Cameroon in the 1960s, according to the supplied organizational history.
- Worked with Virginia Smalldridge.
- Later established World Wide Missions Secondary School in Mpundu-Muyuka in 1969, according to the supplied history.
- Later expanded mission work to other countries.

**Jonathan Smalldridge**
- Son of Bearl Darwin Smalldridge.
- Later assumed international relations leadership.
- Returned to Cameroon in 2008, according to the supplied history.
- Became Director of World Wide Missions Cameroon.
- Appointed Rev. Elias A. Ebai as the first official WWMC Superintendent.

**Rev. Anang Christopher Fang**
- Current/second official WWMC Superintendent, according to the supplied project information.

**Basil Miller**
- Founder of World Wide Missions International, according to the supplied organizational history.
- Born February 26, 1897. Died May 7, 1978.
- The organization originated as Basil Miller Foundation Inc., according to the supplied history.
- The organization later became World Wide Missions.

**Note on conflicting sources:** Some historical sources may contain conflicting dates concerning the founding/name transition of the organization. These conflicts must **not** be silently resolved. Represent them using `approximateDate`, `historical`, `notes`, and `source`/reference fields, and preserve the uncertainty in the data rather than picking one version to present as fact.

### Historical address (Basil Miller Foundation / World-Wide Missions, Inc.)

```
WORLD-WIDE MISSIONS, INC.
1593 East Colorado Boulevard
Pasadena, California, USA

Mailing:
P.O. Box G
Pasadena, CA 91109
```

This address must be explicitly marked as **historical** and must never be automatically presented as the current headquarters.

### Cameroon — supplied historical/project information

- Headquarters: Muyuka
- Mailing: PO Box 44 Muyuka, Southwest Region, Cameroon
- Official authorization: Decree No. 71/DF/608 of 3 December 1971
- Historical headquarters recorded at Muyuka.

Legal information should eventually support attached scanned documents/decrees (via the `Document` model, Phase 9 media work).

### Official purpose statement

> "Religious, charitable, benevolent body of believers, working together to promote production and distribution of Christian literature, to further the training of ministers and other religious workers and to furnish their support, to conduct religious services, and to improve the moral and social conditions of humanity."

This statement belongs under the organization's Purpose/Mission information (About Us → Purpose).

### National Leadership

National Leadership is an **organizational philosophy/approach**, not a historical event. It must be represented in the About Us → Our Approach area (and a dedicated National Leadership subsection), explaining the organization's approach to supporting and developing national Christian leadership. It should not be modeled or displayed as a `HistoryEvent`.

---

## 13. Design System

The site must communicate: professionalism, international mission, Christian identity, institutional credibility, heritage, and trust.

**Primary visual direction**
- Deep navy
- White
- Gold accents
- Clean typography
- Strong visual hierarchy
- Responsive/mobile-first

**Avoid**
- Excessive gradients
- Excessive animations
- Excessive rounded cards
- Cluttered dashboards
- Generic startup/SaaS visual language

The supplied WWM logo and approved visual references should guide the design as it's built out in Phase 4.

**Phase 1 base tokens** (established, subject to refinement in Phase 4): `wwm-navy`, `wwm-navy-light`, `wwm-white`, `wwm-gold`, `wwm-gold-light`, and a neutral background/gray scale (`wwm-bg`, `wwm-neutral-100/300/600/900`), defined in `client/src/index.css` via Tailwind's `@theme`.

---

## 14. Security

- Never expose secrets to the frontend.
- JWT authentication will be implemented in Phase 6.
- Passwords must use bcrypt hashing.
- Protected routes must use authentication/authorization middleware.
- Country-level permissions must eventually be enforced **server-side** — never rely only on frontend role checks.

### Administration roles (Phase 6+)

- `SUPER_ADMIN`
- `INTERNATIONAL_ADMIN`
- `COUNTRY_ADMIN`
- `CONTENT_EDITOR`

`COUNTRY_ADMIN` accounts are eventually restricted to their assigned country. `INTERNATIONAL_ADMIN` accounts have broader access.

---

## 15. Media (Phase 9)

Cloudinary will eventually handle:

- Logos
- Profile photographs
- Church photographs
- Institution photographs
- Historical photographs
- News images
- Event images
- Documents where appropriate

**Phase 9 implementation decisions**: Cloudinary is used through its signed REST API (no SDK). Images (JPEG/PNG/WebP only, default max 4 MB) are uploaded via `POST /api/admin/media/upload/:kind` and attached to the four existing image fields; each owning record stores the Cloudinary public ID in a companion field (`imagePublicId`, `photoPublicId`, `flagImagePublicId`). No separate `Media` model. Public IDs are server-generated under `wwm/<kind>/`, a stored asset is deleted only when no record references it, and credentials come only from `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Documents, logos for organizations and other media remain future work.

---

## 16. Development Rules

- Inspect existing files before modifying them.
- Do not delete working functionality unnecessarily.
- Implement only the requested phase — do not silently implement future phases.
- Use reusable components; do not hardcode organizational data into JSX.
- Keep country data database-driven.
- Do not invent organizational facts. When information is missing, mark it clearly as placeholder/demo data.
- Prefer simple, maintainable code over premature abstraction.
- Keep files reasonably organized (routes/controllers/services/models on the backend; components/pages/services on the frontend).
- Run verification (build/start/tests as applicable) after implementation.
- Update `docs/PROGRESS.md` after successfully completing a phase.
- Do not mark a phase complete if verification failed.

---

## 17. Development Phases

- **Phase 1 — Project Scaffolding** — COMPLETED. React/Vite/Tailwind/React Router/Axios/Lucide frontend; Express/Mongoose backend; CORS, Helmet, central error handling, health-check endpoint; base design tokens.
- **Phase 2 — Core Data Models** — Core database models (`Continent`, `Country`, `Person`, `Organization`, `Ministry`, `CountryAdministration`, `AffiliatePastorsBoard`) and database seed foundation.
- **Phase 3 — Public API** — Public read-only API endpoints over the core models.
- **Phase 4 — Public Website + Design System** — Public website pages and the full design system implementation.
- **Phase 5 — Mission Locations** — Mission Locations hierarchy and country directory (continent/country routes, reusable `CountryPage` template).
- **Phase 6 — Authentication + Admin Foundation** — JWT authentication, bcrypt password hashing, role-based access (`SUPER_ADMIN`, `INTERNATIONAL_ADMIN`, `COUNTRY_ADMIN`, `CONTENT_EDITOR`), admin foundation.
- **Phase 7 — CMS CRUD** — CMS CRUD and organizational management for admins.
- **Phase 8 — Remaining Public Modules** — News, Events, Resources, Prayer Requests, Give, Contact, Missionaries.
- **Phase 9 — Media / Cloudinary** — Cloudinary integration for logos, photographs, documents, and other media.
- **Phase 10 — Production Polish** — Responsive QA, accessibility, SEO, performance, error/loading/empty states, security review, deployment, backups.

### Phase 8 content-module decisions (added 2026-10-16)

- `News`, `Event`, `Resource`, `PrayerRequest`, `ContactMessage` are implemented as listed in §6. News/Events have an optional `country`; publishing is controlled by `status` (`draft`/`published`).
- Public prayer requests and contact messages are user-submitted: prayer requests are moderated (`pending` → `approved`/`rejected`, public only when approved); contact messages are never public. Both public POST endpoints are rate-limited and honeypot-protected.
- Admin access: News/Events follow the Ministry policy (`COUNTRY_ADMIN` scoped to own country); Resources are international (`COUNTRY_ADMIN` read-only); Prayer Requests are moderated by `SUPER_ADMIN`/`INTERNATIONAL_ADMIN`/`COUNTRY_ADMIN` (own country); Contact Messages are `SUPER_ADMIN`/`INTERNATIONAL_ADMIN` only.
- "Give" is deferred until the owner supplies a payment provider and verified giving details.

Do not implement any phase beyond the one currently in progress without explicit instruction. See `docs/PROGRESS.md` for live completion status.

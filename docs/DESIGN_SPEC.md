# World Wide Missions International (WWMI) — UI/UX Design Specification

**Status:** Design specification only. No frontend implementation has begun from this document.

**Revision note (2026-09-08):** the six items previously listed under "Open Decisions Flagged for Approval" have been reviewed and resolved by the project owner. §2 (Navigation), §5 (Country Page), and §6–§7 (organizational charts) below reflect the final approved structure. See the "Approved Design Decisions" and "Decisions Deferred to a Later Phase" sections at the end of this document for the resolution record.

**Primary visual reference:** `docs/design-references/wwm-platform-reference.jpg` — a single composite image containing (1) a homepage design concept for the public World Wide Missions website, and (2) a "Website Structure Overview" diagram documenting the organization's international directory hierarchy and governance org-charts. All analysis below is derived from this image, cross-checked against `docs/PROJECT_SPEC.md` for consistency.

*(Note: an earlier copy of the same reference image exists at `client/src/design-references/WhatsApp Image 2026-08-22 at 11.05.30.jpeg`. `docs/design-references/wwm-platform-reference.jpg` is now the canonical reference location for this document; both files depict identical content.)*

This document defines **how the interface should look and behave**. It does not define data models, business rules, or backend architecture — that is the exclusive responsibility of `docs/PROJECT_SPEC.md` (see §19). Nothing in this document authorizes frontend implementation, package installation, or any Phase 2+ work; it is a reference for future implementation phases (principally Phase 4 and Phase 5) to follow.

Where the reference image does not specify an exact value (a precise hex code beyond what Phase 1 already established, a specific font family, an exact breakpoint), this document proposes a concrete, practical value consistent with the reference's visual language and marks it explicitly as a **recommendation** rather than an observed fact. No organizational data, statistics, or historical claims are invented anywhere in this document — see §18 and PROJECT_SPEC §14.

---

## 1. Brand Identity

### 1.1 Logo Usage

- The WWM mark is a globe/grid icon paired with the wordmark "WORLD WIDE MISSIONS" set on two stacked lines, navy on a light background.
- It appears in exactly two places in the reference — the header (top-left) and the footer (bottom-left, inverted for the dark background) — and should be built as **one logo component with a color-mode prop** (light-background / dark-background), not two separate assets maintained independently.
- The logo is always paired with the full wordmark at these two anchor placements; an icon-only compact variant may be needed for very small mobile headers but is not shown in the reference and should not be assumed necessary unless space constraints demand it in Phase 4.
- The logo is a fixed, non-interactive-looking anchor (top-left) that also functions as a "return home" link — standard convention, not explicitly shown but safe to assume.

### 1.2 Color Palette

| Role | Observed in reference | Existing token (`client/src/index.css`) |
|---|---|---|
| Primary / deep navy | Header nav bar, stats strip, footer, org-chart boxes, dropdown/tree connector lines | `--color-wwm-navy: #0a1f3c` |
| Secondary navy | Secondary chart tiers, hover states | `--color-wwm-navy-light: #123566` |
| White / light background | Page background, card surfaces, utility bar | `--color-wwm-white: #ffffff` |
| Gold accent | "DONATE" button, "OUR MISSION" CTA, accent icons/dividers | `--color-wwm-gold: #c9a24b` |
| Gold accent (hover) | Not directly shown; recommended hover state for gold buttons | `--color-wwm-gold-light: #e0c27a` |
| Page background | Body background between white card sections | `--color-wwm-bg: #f7f7f5` |
| Neutral scale | Borders, muted text, list dividers | `--color-wwm-neutral-100/300/600/900` |

These existing Phase 1 tokens are **confirmed correct by the reference and must be preserved**, per the instruction in this task and in `PROJECT_SPEC.md` §13. The only gap: the reference's "Our Heritage / Our Legacy" panel and the pioneer photograph frame use a warm cream/parchment tone distinct from `wwm-bg`. This spec proposes one new token, `wwm-cream` (approx. `#f3ead9`, to be sampled precisely from final brand assets, not asserted as exact from the compressed reference), reserved for heritage/history surfaces — see §15.

**Rule:** gold is strictly an accent — reserved for CTAs, icon highlights, and small emphasis marks. It never appears as a large fill, section background, or body text color. Navy and white/cream carry the page; gold punctuates it.

### 1.3 Typography Style

- **Headings, nav labels, and buttons** use a bold, uppercase (or tracked title-case) geometric sans-serif with visible letter-spacing — this is the register that signals institutional authority (e.g. "REACHING NATIONS. TRANSFORMING LIVES.", "MISSION LOCATIONS", "OUR PIONEERS").
- **Body copy** is regular-weight sans-serif, sentence case, generous line-height — used for the mission statement, section descriptions, and pioneer bios.
- **Scripture/quote text** gets a distinct italic treatment, smaller than the headline, with its citation set apart (Matthew 28:19) — this pairing (italic quote + citation) is a reusable typographic pattern, not limited to the homepage hero.
- No serif typeface appears anywhere in the reference; the typographic identity is entirely sans-serif, differentiated by weight, case, and letter-spacing rather than by mixing font families.

**Recommendation (Phase 4 decision, not fixed by the reference):** standardize on one geometric/humanist sans-serif family site-wide (e.g. something in the Inter / Source Sans / Work Sans space, or a suitable system-font stack), rather than introducing multiple families.

### 1.4 Heading Hierarchy

| Level | Reference example | Weight | Case |
|---|---|---|---|
| Display (hero) | "REACHING NATIONS. TRANSFORMING LIVES. FULFILLING THE GREAT COMMISSION." | 700–800 | UPPERCASE |
| H1 (page/section title) | "OUR HERITAGE OUR LEGACY", "MISSION LOCATIONS" | 700 | UPPERCASE |
| H2 (card header) | "ABOUT US", "MISSIONS", "AFRICA", "CAMEROON" | 700 | UPPERCASE |
| H3 (component/sub-title) | "OUR PIONEERS", "MISSION STATEMENT" | 600 | Title Case or UPPERCASE |
| Body | Paragraph descriptions | 400 | Sentence case |
| Meta / label | Breadcrumbs ("Home / About Us"), sidebar list items, form labels | 500 | Mixed — breadcrumbs sentence case, sidebar nav items title case |
| Quote | Scripture citation | 400 italic | Sentence case |

### 1.5 Body Text

Body text is kept short and scannable throughout the reference — one to three sentences per block (mission statement excerpt, pioneer bio, section description), never long-form paragraphs on the homepage. Longer-form content (full history, full bios) belongs on dedicated interior pages, with the homepage always showing an excerpt plus a "Read More" action.

### 1.6 Icon Treatment

- Icons are simple, single-color line/solid icons (globe, person silhouette, church/building, heart, map pin, document, bell, dollar sign, phone/envelope), rendered in navy on light backgrounds and white/gold on navy backgrounds.
- Icons consistently pair with a short label beneath or beside them (stats strip, Additional Features strip, continent picker, country quick-links) — icons are never used alone without a text label in this reference, reinforcing clarity over decoration.
- Continent and country-administration icons are slightly more illustrative (silhouette continent shapes, building/institution icons) but remain flat and single-tone, consistent with the rest of the icon system.

### 1.7 Borders and Dividers

- Section bands are separated by solid color blocks (navy strip vs. white/cream panel) rather than by rules/borders — banding itself is the primary separator.
- Within cards, thin 1px neutral dividers separate a sidebar list from its content area (e.g. the About Us card's link list vs. its mission-statement text).
- Org-chart components use solid navy connector lines between tiers — these lines are structural (showing reporting relationships), not decorative.
- No heavy drop shadows or thick decorative borders appear anywhere in the reference.

### 1.8 Image Treatment

- Hero and heritage photography is documentary/editorial in style (a family silhouette at sunset; an archival-style couple portrait; field photography of missionaries and institutions) — never stock-abstract, illustrated, or overly staged/corporate.
- The hero image carries a dark gradient/overlay so white headline text stays legible — this overlay treatment should be a reusable pattern for any full-bleed photo hero (including country-page heroes).
- Leadership/person photography is consistently cropped to circular or square headshot frames at a fixed aspect ratio across a grid (International Administration's 8-person grid) — one consistent crop/frame treatment per grid, not mixed aspect ratios.
- Institution/church photography is landscape, unfiltered, naturalistic — representing real buildings/places rather than stock imagery.

### 1.9 Overall Visual Tone

The reference reads as **professional, institutional, international, Christian, mission-focused, trustworthy, elegant, established, and heritage-oriented** — achieved through: a restrained three-color palette, formal photography, structural org-chart diagrams for governance content, breadcrumb trails signaling navigable depth, and flat/minimal-radius surfaces. It deliberately avoids:

- **A generic SaaS dashboard feel** — no large data-viz widgets, no dense metric tiles, no dashboard chrome.
- **A modern startup landing page feel** — no oversized gradient blobs, no playful illustration, no single-CTA-obsessed scroll-jacking layout.
- **An overly animated marketing site feel** — the reference shows static, information-dense sections; motion should be minimal (simple fades/hovers only, no scroll-triggered choreography).
- **Card-heavy design with excessive rounded corners** — cards are flat-edged or minimally rounded rectangles with thin borders, not floating pill-shaped tiles.
- **Gradient-dominated design** — the only gradient observed is the hero's photo-darkening overlay; flat color fills are used everywhere else.

This tone requirement, already stated in `PROJECT_SPEC.md` §13, is directly and consistently confirmed by the reference image.

---

## 2. Header and Navigation

### 2.1 Logo Placement

Top-left, fixed position, in both the utility bar row and (inverted) the footer. See §1.1.

### 2.2 Main Navigation

Two-tier header:

1. **Utility bar** (top row, light background): logo at far left; social icons (Facebook, Twitter/X, YouTube, Instagram) and a search icon at far right.
2. **Main nav bar** (second row, full-width navy band): primary navigation links left-to-right, with a gold "DONATE" button pinned at the far right.

**FINAL APPROVED STRUCTURE** (resolved 2026-09-08 — see "Approved Design Decisions" at the end of this document): the primary nav stays exactly as shown in the reference, with no additional top-level items:

**Home, About Us, Missions, Mission Locations, Church Institutions, Non-Church Institutions, Resources**, plus the gold **Donate** CTA.

### 2.3 Navigation Hierarchy

`PROJECT_SPEC.md` §4 defines a longer top-level list (also including Missionaries, News & Events, Prayer Requests, Give, Contact). Rather than adding new top-level nav items — which would move away from the reference's clean 7-item bar — every one of those sections is reachable through dropdown/secondary navigation on an existing primary item, or through the footer/utility areas. This keeps the navbar visually consistent with the reference while still exposing every section `PROJECT_SPEC.md` §4 requires:

- **Missions** dropdown contains: Mission Areas, Missionaries, Ministries, Where We Serve.
- **About Us** dropdown contains: Who We Are, Mission, Vision, Values, Beliefs, Purpose, Our Approach, National Leadership, Our History, International Administration, Legal & Organizational Information — the full `PROJECT_SPEC.md` §4 subsection list, each as its own row (superseded 2026-09-08; see §2.4 for detail).
- **Resources** dropdown contains: News & Events, Resources, Prayer Requests. *(The "Resources" entry within this dropdown refers to the resource-library landing page itself — sermons, devotionals, tracts, downloads — distinct from the parent "Resources" nav item, which is the entry point into this whole group.)*
- **Give** remains satisfied by the gold **Donate** CTA button alone; no separate "Give" text link is added.
- **Contact** is not placed in any dropdown. It remains reachable through the footer (§12) and through utility/CTA areas (e.g. the utility bar, and the homepage "Additional Features" band, §11) on every page.

This structure is final and no longer an open decision (see the resolution record at the end of this document).

### 2.4 Dropdown Indicators

Each nav item with sub-content shows a small caret/chevron (▾) to its right, visible in the reference on About Us, Missions, Mission Locations, Church Institutions, Non-Church Institutions, and Resources. Home and Donate carry no caret, since they are direct links/actions, not menus.

- **About Us**: vertical dropdown list — Who We Are, Mission, Vision, Values, Beliefs, Purpose, Our Approach, National Leadership, Our History, International Administration, Legal & Organizational Information. **(Superseded 2026-09-08, Phase 4 implementation instructions.)** The previously condensed "Leadership" entry is unpacked into its full set of distinct rows (Purpose, Our Approach, National Leadership, Our History, International Administration) so the dropdown matches `PROJECT_SPEC.md` §4's About Us subsection list one-for-one, rather than grouping several of them under one label.
- **Missions**: vertical dropdown list — Mission Areas, Missionaries, Ministries, Where We Serve (per §2.3).
- **Mission Locations**: the one **mega-menu**, showing the continent grid (6 tiles) directly in the dropdown, because of this item's extra hierarchy depth (Continents → Countries → Country).
- **Church Institutions, Non-Church Institutions**: simple vertical dropdown lists, matching each section's homepage sidebar content.
- **Resources**: vertical dropdown list — News & Events, Resources, Prayer Requests (per §2.3).
- Dropdowns are white-background panels with navy text, opening below the nav bar, closing on outside-click or Escape.

### 2.5 Social Media Icons

Positioned top-right of the utility bar (Facebook, Twitter/X, YouTube, Instagram), repeated again in the footer's bottom bar. One shared icon-row component, two placements.

### 2.6 Search

A single search icon sits at the far-right of the utility bar, beside the social icons.

**Concept approved, implementation deferred** (resolved 2026-09-08): this is intended to eventually be a **global search**, conceptually capable of returning results across Countries, Churches, Institutions, People, Pastors, Missionaries, Ministries, News, Events, and Resources — e.g. searching "Cameroon" could surface the matching country page alongside related churches, institutions, people, and content. This cross-entity scope is a concept-level requirement only; no search implementation, API, or indexing is authorized by this document. The visual interaction pattern (inline-expanding field vs. modal overlay) and the actual query/results implementation are both deferred to Phase 4, at which point they should also be checked against `PROJECT_SPEC.md` for any backend/API implications (a cross-entity search endpoint is a data/API concern, not a UI concern, and would need to be reflected in `PROJECT_SPEC.md` before being built).

### 2.7 Donate CTA

Gold-filled button, uppercase label, right-aligned at the end of the main nav bar — the single highest-emphasis interactive element in the header, on every page, at every breakpoint (see §2.8).

### 2.8 Desktop Layout

Full two-tier header as described in §2.2, all nav items visible inline, dropdowns open on hover.

### 2.9 Mobile Navigation Behavior

- Header collapses to logo (left) + hamburger icon (right); utility bar's social/search icons either move into the mobile menu panel or are dropped in favor of the footer's social row.
- Hamburger opens a full-height off-canvas (or full-screen) navy panel listing all primary nav items stacked vertically; items with dropdowns use an accordion (tap to expand/collapse) rather than hover.
- The Donate CTA stays visible and prominent in the mobile menu (e.g. pinned at the top of the panel), preserving its primary-action status.
- Focus moves into the open panel and is trapped there until closed (see §16).

---

## 3. Homepage

The reference lays out the homepage as a sequence of full-width horizontal bands. The stated goal — communicating identity/mission before deeper directory functionality — is reflected directly in this ordering: identity and heritage content (bands 1–4) precede the directory-style content (bands 5–6).

1. **Hero section** — full-bleed background photograph (family/community silhouette at sunset, documentary style), dark overlay for legibility, main headline in bold uppercase ("REACHING NATIONS. TRANSFORMING LIVES. FULFILLING THE GREAT COMMISSION."), supporting scripture ("Go ye therefore, and teach all nations..." — Matthew 28:19) in italic beneath it, and a primary CTA ("OUR MISSION", gold-filled) paired with a secondary CTA ("WHERE WE SERVE", navy-outlined).
2. **Global mission statistics/highlights** — full-width navy band, 4-column icon-led tiles: "A Global Mission", "A Rich Heritage", "Churches & Institutions", "Partner With Us." *(Any specific figures shown in the mockup, such as a nation count or founding year, are placeholder/illustrative content in the design concept and must be replaced with verified organizational data at implementation time — never hardcoded from the mockup, per `PROJECT_SPEC.md` §14.)*
3. **Heritage section** — warm cream-background band: "Our Heritage / Our Legacy" narrative + "Our Story" CTA, paired with an archival-style photograph.
4. **Pioneer/missionary section** — presented within the same heritage band: a named founder/pioneer bio card (photo, name, life dates, short description, "Read More" CTA) — in the reference this is Rev. Bearl D. Smalldridge and Virginia Smalldridge.
5. **About Us / International Administration** — two-card row: About Us card (sidebar of subsections + mission-statement excerpt); International Administration card (leadership photo grid + "Read All Leadership" CTA).
6. **Missions section** — card with a sidebar list of mission activities (Church Planting, Evangelism, Leadership Training, Education, Compassion Ministries, Media & Publications, Missionary Care) + supporting photo + short description.
7. **Church institutions** — card with sidebar links (Find a Church, About Our Churches, Church Network, Ministries, Resources), a "find a church near you" location search box, a world map with location pins, and a "View All Churches" CTA.
8. **Non-church institutions** — card with sidebar links (Schools, Hospitals & Clinics, Orphanages, Bible Colleges, Skills Training, Community Projects), supporting photo, and a "View All Institutions" CTA.
9. **Mission locations** — a three-card progressive-drill-down preview: world map + continent picker → Africa (country list + regional map) → Cameroon (flag + 3 quick-link icons + photo + "About Cameroon Field" CTA). This row is the clearest on-page evidence of the reusable Continents → Countries → Country template (§4–§5).
10. **News & Events, Prayer Requests, Missionaries, Resources, Give, Contact** — presented together as the **"Additional Features" band**: a full-width navy strip with 6 icon+label+one-line-description tiles (see §11 for detail on each).
11. **Footer** — full-width navy band (see §12).

No separate "Global Presence" section is duplicated outside of the stats strip (band 2) and the Mission Locations preview (band 9) — a standalone world-presence visualization is unnecessary since both already exist.

---

## 4. Mission Locations

The reference's "Website Structure Overview" diagram (right half of the image) is the authoritative structural source for this section and matches `PROJECT_SPEC.md` §5 precisely:

```
World Wide Missions
 → Mission Locations
    → Continents: Africa, Asia, Europe, North America, South America, Oceania
       → Countries (worked example under Africa): Cameroon, Liberia, Ghana, Kenya,
          Uganda, Zimbabwe, South Africa, Zambia, Tanzania, Nigeria, DR Congo, Rwanda,
          Burundi, Malawi, ...
          → Country Information (Country Administration | WWM Pastors | Affiliate
             Pastors, plus the fuller section set defined in PROJECT_SPEC §5 and
             restated in §5 below)
```

**Route structure (confirmed against the reference and PROJECT_SPEC §5):**

```
/mission-locations
/mission-locations/:continent           e.g. /mission-locations/africa
/mission-locations/:continent/:country  e.g. /mission-locations/africa/cameroon
```

**UI pattern per level:**

| Route level | UI pattern from reference |
|---|---|
| `/mission-locations` | Muted world map + "Select a Continent" 6-tile grid (icon + label per continent) |
| `/mission-locations/:continent` | Breadcrumb ("Home / Mission Locations / Africa") + alphabetized multi-column country list + accent-highlighted regional map + "View All Countries" CTA |
| `/mission-locations/:continent/:country` | Breadcrumb ("Home / Mission Locations / Africa / Cameroon") + country flag + 3-icon quick-link row (Country Administration, WWM Pastors, Affiliate Pastors) + representative photo + "About [Country] Field" CTA |

**Hard requirement, restated from the task:** country-specific React pages (`CameroonPage.jsx`, `UgandaPage.jsx`, etc.) must never be created. Exactly one `CountryPage.jsx`-style template renders every country from route params + API data — flags, photos, names, and slugs are all data-driven, never hardcoded per country. Cameroon, as shown in the reference, is a worked example of this template, not a distinct design to be replicated by hand for other countries. See §18 for the full architectural principle.

Map components (world map, regional map) use a consistent treatment: muted grey for countries/regions without recorded WWM presence, gold/accent highlight for those with presence — consistent with gold-as-accent (§1.2).

---

## 5. Country Page

Analyzing the Cameroon instance in the reference strictly as a template, a single reusable country page must be able to present all of the following (combining what the reference visually depicts with the fuller list `PROJECT_SPEC.md` §5 requires):

1. **Country identity** — country name, short overview/description, representative hero photo.
2. **Country flag** — displayed prominently near the country name/breadcrumb (shown in the reference as a small flag icon beside the country title).
3. **Country administration** — rendered as an organizational chart (see §6).
4. **WWM pastors** — a photo-card directory/grid.
5. **Affiliate pastors** — rendered as an organizational chart (see §7).
6. **Churches** — a grid/list of church-type organizations in that country, reusing the church-card component from the homepage.
7. **Institutions** — a grid/list of non-church organizations (school, hospital, clinic, orphanage, Bible college, training center, community project) in that country.
8. **Missionaries** — a photo-card directory scoped to that country.
9. **Ministries** — a list/grid of ministries active in that country.
10. **Country mission history** — a timeline of that country's `HistoryEvent` records (see §8's timeline pattern, scoped by country).
11. **News** and **Events** — scoped lists reusing the site-wide News/Event card components.
12. **Contact information** — country-level address/phone/email block.

**Reusability requirement:** every one of these sections must degrade gracefully to a defined empty state (e.g. "No churches listed yet for this country") when a given country has little or no seeded data — since the same template must serve a country with a fully staffed administration and rich content, and a country with almost nothing populated yet, without the page looking broken in either case.

**FINAL APPROVED: Country Page Section Navigation** (resolved 2026-09-08). A flat list of 10+ anchor links was rejected as unusable. Instead, the country page uses a **sticky, grouped section navigation** with six top-level entries, each covering one or more of the 12 items listed above:

| Nav group | Contains |
|---|---|
| **Overview** | Country identity, flag, overview/description, hero photo, and Country Mission History (the history timeline is presented within Overview rather than as its own top-level nav entry, to keep the group count at six) |
| **Leadership** | Country Administration (org chart, §6), WWM Pastors, Affiliate Pastors (org chart, §7) |
| **Churches & Institutions** | Churches, Schools, Hospitals, Clinics, Bible Colleges, Other Institutions (Orphanages, Training Centers, and Community Projects — per the `Organization` type categories in `PROJECT_SPEC.md` §6 — are grouped under "Other Institutions" for this nav's purposes; all types remain individually filterable within the section itself, only the top-level nav label is consolidated) |
| **Missionaries & Ministries** | Missionaries, Ministries |
| **News & Events** | News, Events |
| **Contact** | Country-level contact information |

This mapping covers every item required by `PROJECT_SPEC.md` §5 (Overview, History, Administration, WWM Pastors, Affiliate Pastors, Churches, Institutions, Missionaries, Ministries, News, Events, Contact) — nothing from that list is dropped, several are simply grouped under a shared nav label. This navigation is sticky/anchor-based where screen space allows and must be responsive (collapsing to a horizontally scrollable tab strip or a dropdown/select on narrow viewports, consistent with §13). It is a single reusable component, driven by which sections a given country actually has data for, not a hardcoded 6-item menu duplicated per country.

---

## 6. Country Administration

The reference's org-chart diagram must drive the visual design of this component exactly:

```
                    Superintendent
                          │
        ┌─────────────────┴─────────────────┐
 Assistant Superintendent                Secretary
        │
┌───────┼────────────┬─────────────┬────────────┐
Treasurer     Missions Director  Board Chairman  Youth Director  Women Director
        │
                Executive Committee
```

(Rendered in the reference as: Superintendent at the top tier; Assistant Superintendent and Secretary on the second tier, connected beneath Superintendent; Treasurer, Missions Director, Board Chairman, Youth Director, and Women Director on a third tier; Executive Committee spanning the base, connected upward.)

**UI requirements:**
- Each box in the chart is a navy-filled tile with the **position title** as its primary label; the **person's name and photo** (from the `Person` model, via the position/role link) should be layered into or attached to that tile once data exists — the chart shows structure/positions first, people second.
- Connector lines are solid navy, showing clear reporting-line relationships between tiers.
- This is a **generic hierarchy-rendering component**, parameterized entirely by `CountryAdministration` API data — **the specific positions listed above must never be hardcoded into JSX**. If a country's administration data has different positions, a different number of tiers, or is incomplete, the same component must render whatever hierarchy the data actually describes.
- **Responsive behavior (FINAL, approved 2026-09-08):** desktop may use the visual hierarchical chart shown in the reference. Mobile must **not** simply scale that chart down — it must fall back to a **vertical, tier-grouped stacked list** (e.g. a "Superintendent" heading, then an indented group for "Assistant Superintendent / Secretary", then their reports, etc.), preserving the hierarchical relationships through grouping/indentation/clearly separated leadership levels rather than flattening to an unordered name list. The underlying data (and the data-driven, non-hardcoded rendering rule above) is identical between the desktop and mobile presentations — only the layout changes. See §13.

---

## 7. Affiliate Pastors Board

The reference's second org-chart diagram:

```
                     Chairman
                        │
    ┌──────────┬────────┴────────┬──────────────────────┐
Vice Chairman Secretary       Treasurer      Public Relations Officer
                        │
                Regional Coordinators
                        │
                  Affiliate Pastors
```

**UI requirements:**
- Same chart component/pattern as Country Administration (§6) — this should be **the same reusable `LeadershipChart`/org-chart component**, configured with different data, not a second bespoke component. The two boards share an identical visual grammar (tiered navy boxes, navy connector lines) in the reference.
- Entirely data-driven from `AffiliatePastorsBoard` records — positions (Chairman, Vice Chairman, Secretary, Treasurer, Public Relations Officer, Regional Coordinators, Affiliate Pastors) are the reference's example values, not values to hardcode into the component.
- Same mobile fallback rule as §6 (final, approved 2026-09-08): vertical tier-grouped list on small screens, same underlying data as desktop.
- Must never be built as a Cameroon-specific implementation — one component, rendered per-country from that country's board data, exactly like Country Administration.

---

## 8. About / History

The reference does not show a full History page, but it establishes the visual grammar such a page — and each country's "country mission history" section — must extend:

- **Founder/pioneer profiles**: portrait photo + name + life dates (e.g. "1928–2016") + short description, exactly as shown for Rev. Bearl D. Smalldridge and Virginia Smalldridge. This is a single reusable `PioneerCard`/`PersonCard` pattern, reused for founders, pioneers, International Administration leadership, WWM Pastors, Affiliate Pastors, and Missionaries alike — not a bespoke layout per person type.
- **Historical photographs**: presented in an archival portrait style (posed, black-and-white-or-sepia-leaning treatment implied by the reference's pioneer photo), distinct from the documentary/field-photography style used for current missions/institutions content.
- **Historical timeline**: a chronological timeline component (vertical stack of dated entries; direction — top-to-bottom vertical is the safer default for mobile — is a Phase 4 decision) driven by `HistoryEvent` records, used both on a global History page and, scoped per-country, on each country page's mission-history section. One component, two data scopes.
- **Important dates / organizational milestones**: each timeline entry needs an explicit date/year display. Per `PROJECT_SPEC.md` §12, when a date is approximate or sources conflict, the UI must visibly communicate that (e.g. an "approx." qualifier or a small footnote linking to the recorded `source`/`notes` field) — never silently presenting an uncertain date as settled fact.
- **Current vs. historical leadership**: these must be visually and structurally distinguished — e.g. a clearly labeled "Historical Leadership" or "Past Leaders" section/heading separate from the "current" International Administration / Country Administration displays, so a visitor cannot mistake a past superintendent for the present one.
- **Historical addresses**: any historical address (e.g. a past international headquarters) must carry an explicit "Historical" label/badge in the UI and must never be displayed in a way that could be mistaken for a current contact address.
- **Legal information**: organizational/legal information (e.g. founding documents, decrees) should be presented in a plain, document-style layout (title, date, short description, and — once the `Document` model/Cloudinary work lands in Phase 9 — a link to the scanned original), consistent with the reference's overall formal, institutional tone rather than a marketing layout.
- **Visual distinction principle:** the reference's warm cream/parchment "Our Heritage" band, distinct from the site's normal white/`wwm-bg` sections, should be the general pattern for marking historical content apart from current operational content sitewide (see the proposed `wwm-cream` token in §15).

---

## 9. Churches and Institutions

The reference treats **Church Institutions** and **Non-Church Institutions** as two clearly separate discovery experiences, each with its own homepage card and (implied) its own directory page:

### Church Institutions
- Sidebar-style entry points: Find a Church, About Our Churches, Church Network, Ministries, Resources.
- A **location-based search** ("find your city, state or country" + Search button) paired with a world map showing pin markers — the primary discovery mechanism for churches.
- A "View All Churches" CTA leading to a full church directory.

### Non-Church Institutions
- Sidebar categories: Schools, Hospitals & Clinics, Orphanages, Bible Colleges, Skills Training, Community Projects.
- Supporting photography and a "View All Institutions" CTA leading to a full institution directory.
- The category list itself (Schools, Hospitals & Clinics, etc.) doubles as an implicit filter set once a directory/search page is built.

**Directory/search requirement:** since both directories are expected to grow, each needs (at minimum) a **type filter** (church vs. the non-church categories listed above), a **country/location filter** (tying back into the Mission Locations hierarchy), and a **text search** — reusing the same `DirectorySearch` component pattern for both, since the underlying data (`Organization` model, per `PROJECT_SPEC.md` §8) is unified. The reference's location search box on the Church Institutions card is the visual precedent for this filter/search UI.

Both directories reuse the same `OrganizationCard` component (photo, name, type, location, link) — differentiated only by the `type` filter applied, not by separate components.

---

## 10. Missions

The reference presents mission activities as a simple sidebar list paired with one supporting photo and a short description: **Church Planting, Evangelism, Leadership Training, Education, Compassion Ministries, Media & Publications, Missionary Care.**

**Reusable pattern:** a `MissionCard`/`MissionHighlight` component — icon or small image + title + one-line description — repeated for each mission area, laid out as a list (as in the homepage card) on the Missions overview and potentially as a grid of cards on a dedicated Missions page. The homepage treatment (compact sidebar list) and a fuller Missions landing page (expanded card grid) can both be built from the same underlying content/data, styled differently by context, rather than maintaining the list twice.

---

## 11. Additional Features

The reference's "Additional Features" band presents six items as a uniform icon + label + one-line-description tile, in a single row (desktop):

| Item | Icon | Description shown |
|---|---|---|
| News & Events | document/newspaper | "Latest mission updates and events" |
| Prayer Requests | bell | "Submit and view prayer needs" |
| Missionaries | person silhouette | "Meet our missionaries and their stories" |
| Resources | document | "Sermons, devotionals, tracts, and more" |
| Give Online | dollar sign | "Support the mission securely" |
| Contact Us | map pin | "Get in touch with us worldwide" |

**UI pattern per section (extrapolated consistent with the reference's visual language, since the mockup shows only the homepage entry tile for each):**

- **News & Events**: reuse a shared `NewsCard`/`EventCard` (image, title, date, short excerpt, link) in a list/grid on a dedicated News & Events page; events additionally carry a date/time and location.
- **Prayer Requests**: a simple submission form (name, request text, optional privacy toggle) plus, if publicly shown, a list of approved/public requests using a `PrayerRequestCard` (short text + date, no unnecessary personal detail exposed).
- **Missionaries**: reuses the `PersonCard` pattern (§8) filtered to the missionary role, as a directory grid.
- **Resources**: a `ResourceCard` (title, type/icon such as document/audio/video, short description, download or view link) in a filterable list/grid.
- **Give Online**: a focused, low-distraction page — clear amount/purpose framing and a prominent secure CTA button — consistent with the reference's minimal, non-flashy CTA styling (no gradients, no urgency-manufacturing design tricks).
- **Contact Us**: address/phone/email block (matching the footer's contact styling for visual consistency) plus a contact form using the same form component/styling as Prayer Requests.

All six reuse the icon-label-description tile pattern from this band as their homepage teaser, linking through to their respective full page.

---

## 12. Footer

Five-column layout on a navy background:

1. **WWM branding**: logo lockup (inverted/light color-mode) + restated tagline/mission statement ("Reaching nations. Transforming lives. Fulfilling the Great Commission.").
2. **Quick Links**: About Us, Missions, Mission Locations, Church Institutions, Non Church Institutions.
3. **Resources**: News & Events, Prayer Requests, Missionaries, Downloads, FAQs.
4. **Get Involved**: Pray, Give, Go, Partner With Us, Volunteer.
5. **Contact**: address, phone, and email, each paired with a small icon, matching the icon treatment described in §1.6.

**Bottom bar**: a divider, then a copyright line ("© 2024 World Wide Missions International. All Rights Reserved." — the year must be dynamic/current at implementation, not hardcoded from the mockup) alongside a repeated social-icon row (same component as the header's, §2.5).

---

## 13. Responsive Design

The reference is a desktop-width composition. The following rules extrapolate its layout logic for tablet and mobile using standard responsive practice — **the desktop layout must not simply be scaled down**; each pattern below describes an intentional restructuring per breakpoint.

### Header/Navigation
- **Desktop**: full two-tier header, inline nav, hover dropdowns/mega-menu.
- **Tablet**: utility bar may simplify (e.g. drop or condense social icons); main nav may collapse lower-priority items into a "More" dropdown before switching fully to mobile behavior.
- **Mobile**: logo + hamburger only; full nav moves into an off-canvas panel with accordion sub-menus (§2.9).

### Hero Sections
- **Desktop**: full-bleed image, large multi-line headline, quote, and side-by-side dual CTA buttons.
- **Tablet**: headline font-size steps down; CTAs may remain side-by-side if space allows or stack if not.
- **Mobile**: headline steps down at least one more size level to avoid awkward multi-line wrapping; CTAs stack vertically, full-width; hero image crop should be re-evaluated for a taller/narrower aspect ratio (art-direction, not just a scaled-down crop) so the subject remains framed well.

### Multi-Column Layouts
- **Desktop**: card rows at their full column count (2–3 across for content cards, 4 across for the stats strip, 6 across for the continent grid, 6 across for the Additional Features strip).
- **Tablet**: 3-across rows become 2-across (third item wraps); the stats strip goes 4→2 columns; the continent grid reflows to 3×2; the Additional Features strip goes 6→3 columns (two rows).
- **Mobile**: everything collapses to a single column, full width, stacked in the same reading order as desktop.

### Country Administration / Affiliate Pastors Hierarchy
- **Desktop/tablet**: horizontal tiered tree with connector lines, as in the reference (tablet may need horizontal scroll within the chart's own container rather than shrinking boxes illegibly).
- **Mobile**: switches to a **vertical, tier-grouped stacked list** (not a horizontal tree, and not a flat unordered list) — this is a required transformation, not an optional scale-down, since the reference's chart width cannot fit a phone screen legibly. See §6/§7.

### Country Cards / Directory Cards
- **Desktop**: grid layout (e.g. 3–4 per row for church/institution/person cards).
- **Tablet**: 2 per row.
- **Mobile**: 1 per row, full width, with image-top/content-below stacking within each card.

### Directory/Search Layouts
- **Desktop**: filters (type, location) displayed inline or in a persistent sidebar alongside search results.
- **Tablet**: filters may collapse into a toggled panel above the results.
- **Mobile**: filters collapse into a "Filters" button opening a full-screen or bottom-sheet filter panel, with results stacked as a single column below the search bar.

### Footer
- **Desktop**: 5 columns side-by-side.
- **Tablet**: reflows to 2–3 columns, wrapping to additional rows.
- **Mobile**: all columns stack vertically in the same left-to-right reading order as desktop, with the bottom copyright/social bar remaining centered.

### Tables / Organizational Structures
- Any tabular data (e.g. an administration listing shown as a table rather than a chart, if used elsewhere) should convert to a stacked card-per-row layout on mobile rather than a horizontally scrolling table, to avoid tiny, hard-to-read cells — consistent with the same "restructure, don't shrink" principle applied to the org-charts above.

---

## 14. Reusable Components

Components implied by the reference that should exist once and be shared across pages, not duplicated. **This is an inventory for future planning — none of these are to be built as part of this design-specification task.**

| Component | Purpose / used in |
|---|---|
| `Header` | Site-wide utility bar + main nav + dropdown/mega-menu |
| `MobileNavigation` | Off-canvas/accordion nav panel for small breakpoints |
| `Footer` | Site-wide footer (§12) |
| `HeroSection` | Homepage hero; reusable for Country Overview and other section-landing heroes |
| `SectionHeader` | Breadcrumb + title pattern used atop every content card/page (e.g. "Home / About Us") |
| `CTAButton` | Primary (gold-filled), secondary (outline), and tertiary (small navy) button variants (§2.7, §15.7) |
| `MissionHighlight` / `MissionCard` | Mission-area tiles (§10) |
| `PersonCard` | Generic person display: leadership, pastors, missionaries (§6–§8, §11) |
| `PioneerCard` | Founder/pioneer variant of `PersonCard` with life-dates and heritage styling (§8) |
| `CountryCard` | Country tile within a continent's country list/grid |
| `ContinentCard` | Continent tile within the Mission Locations picker grid |
| `OrganizationCard` | Church/institution display, filtered by type (§9) |
| `NewsCard` / `EventCard` | News and event list/grid items (§11) |
| `ResourceCard` | Resource/download list items (§11) |
| `PrayerRequestCard` | Public prayer-request list items (§11) |
| `LeadershipChart` | Generic data-driven org-chart renderer, used for both Country Administration and Affiliate Pastors Board (§6–§7) |
| `WorldMap` / `RegionMap` | Muted/accent-highlighted map component for Mission Locations and church-finder search (§4, §9) |
| `DirectorySearch` | Shared filter/search UI for church and institution directories (§9) |
| `Timeline` | Chronological history display, supporting approximate/uncertain dates (§8) |
| `Breadcrumbs` | Navigation trail, used atop nearly every non-home page/card |
| `StatTile` | Icon + heading + short text tile, used in the stats strip and Additional Features band |
| `SectionBand` | Full-width background wrapper (light / navy / cream variants) for homepage/section layout rhythm |
| `CountrySectionNav` | Sticky/anchor grouped section navigation for country pages (§5): Overview, Leadership, Churches & Institutions, Missionaries & Ministries, News & Events, Contact |
| `GlobalSearch` *(concept approved, implementation deferred — §2.6)* | Cross-entity search UI (countries, churches, institutions, people, pastors, missionaries, ministries, news, events, resources); not to be built until Phase 4, and only after any needed backend/API support is reflected in `PROJECT_SPEC.md` |

---

## 15. Design Tokens

This section translates the reference into practical tokens for later Tailwind implementation. **It extends, and does not replace, the existing tokens in `client/src/index.css`.**

### 15.1 Colors

```
Existing (Phase 1 — preserve as-is):
  --color-wwm-navy:        #0a1f3c   /* primary — header, footer, dark bands, chart tiles */
  --color-wwm-navy-light:  #123566   /* secondary navy — hover states, secondary tiers */
  --color-wwm-white:       #ffffff   /* base surface */
  --color-wwm-gold:        #c9a24b   /* accent — CTAs, highlights */
  --color-wwm-gold-light:  #e0c27a   /* accent hover/active */
  --color-wwm-bg:          #f7f7f5   /* page background */
  --color-wwm-neutral-100: #f5f5f4   /* light borders/dividers */
  --color-wwm-neutral-300: #d6d3d1   /* borders */
  --color-wwm-neutral-600: #57534e   /* muted/secondary text */
  --color-wwm-neutral-900: #1c1917   /* body text on light backgrounds */

Proposed addition (Phase 4 — needs final sampling from approved brand assets,
not asserted as exact from the compressed reference image):
  --color-wwm-cream:       #f3ead9   /* heritage/history section background */
```

### 15.2 Typography Scale

Recommendation (see §1.3–1.4 for reasoning): a scale of roughly Display / H1 / H2 / H3 / Body / Small, with uppercase + letter-spacing reserved for Display through H2 and nav/button labels, and sentence case for Body/quote text. Exact rem/px values and a specific font-family are a Phase 4 decision.

### 15.3 Spacing Principles

- Consistent vertical rhythm between homepage bands (e.g. a single `py-*` scale applied uniformly — larger on desktop, reduced proportionally on mobile).
- Card-internal spacing should be tighter for list/directory-style cards (About Us, Missions, Mission Locations) and more generous for narrative content (hero, heritage section).

### 15.4 Container Widths

A single max-width content container (centered, with side padding) should wrap all section content, consistent with the reference's aligned card-grid edges; full-bleed treatment is reserved specifically for the hero background image and the navy/cream section bands themselves, not for their inner content.

### 15.5 Border Radius Philosophy

Minimal/flat. Cards, buttons, and tiles use no radius or a small radius at most (e.g. Tailwind's `rounded`/`rounded-sm`). Large, pill-shaped, or heavily rounded (`rounded-xl`/`rounded-2xl`/`rounded-full` except for circular photo crops) treatments are explicitly avoided, per §1.9 and `PROJECT_SPEC.md` §13's "avoid excessive rounded cards."

### 15.6 Shadows

Minimal. Prefer a thin 1px neutral border (`wwm-neutral-300`) or, at most, a subtle `shadow-sm` to lift a card off the page background — never heavy `shadow-lg`/`shadow-xl` elevation, which would read as a generic SaaS/app aesthetic rather than the flat, institutional look in the reference.

### 15.7 Button Styles

| Variant | Fill | Text | Hover | Example |
|---|---|---|---|---|
| Primary | `wwm-gold` | `wwm-navy` | `wwm-gold-light` | Donate, Our Mission |
| Secondary/outline | transparent, white border | `wwm-white` | fills `wwm-white`, text becomes `wwm-navy` | Where We Serve |
| Tertiary (card action) | `wwm-navy` | `wwm-white` | `wwm-navy-light` | Read More, View All, About [Country] Field |

All buttons: uppercase label, medium letter-spacing, flat/minimal-radius, visible focus ring (see §16).

### 15.8 Icon Sizing

A small consistent icon-size scale (e.g. small for inline/list icons such as contact/footer icons; medium for stat-tile and Additional-Features icons; the continent-picker icons are the largest icon usage in the reference). Icons should always be sized in proportion to their paired label text, not oversized relative to it.

### 15.9 Section Spacing

Each homepage band should use one of three background treatments — light (`wwm-bg`/white), navy, or cream — applied consistently per the content type described in §3, with uniform top/bottom padding per breakpoint so the page reads as a coherent rhythm of bands rather than visually inconsistent chunks.

---

## 16. Accessibility

- **Color contrast**: navy-on-white and white-on-navy text pairings meet WCAG AA comfortably. Gold (`#c9a24b`) on a light background is borderline for small text — restrict gold to buttons (sized and weighted appropriately) and large headings/icons, never small body or link text on a light background. Verify actual ratios against final tokens once implemented, rather than assuming from the mockup.
- **Keyboard navigation**: all dropdowns/mega-menus must open/close and be traversable via keyboard (Tab, Enter/Space to toggle, Escape to close, Arrow keys to move within a menu), not hover-only. The Mission Locations continent/country pickers and org-chart entries (where they link to a person's bio) must be reachable and operable via keyboard alone.
- **Focus states**: every interactive element (nav links, dropdown items, buttons, form fields, map pins/markers, chart entries) needs a visible focus indicator distinct from its default and hover states.
- **Semantic HTML**: use real `<nav>`, `<header>`, `<footer>`, `<main>`, heading levels in logical document order (one `<h1>` per page), `<button>` for actions and `<a>` for navigation (not divs with click handlers), and list markup (`<ul>`/`<ol>`) for the sidebar link lists and country lists shown throughout the reference.
- **Image alt text**: all meaningful photography (pioneers, leadership, institutions, country hero images, church/institution photos) requires descriptive `alt` text; purely decorative images (e.g. the hero's background photo, once its meaning is carried by the overlaid headline text) may use `alt=""`.
- **Form labels**: the church-finder location search, and any future Prayer Request/Contact forms, need properly associated `<label>` elements (visually hidden if a placeholder-only look is desired), clear placeholder-vs-label distinction, and non-color-only inline validation messaging.
- **Accessible navigation**: breadcrumb trails should use an ordered/semantic breadcrumb pattern (e.g. `<nav aria-label="Breadcrumb">` with an ordered list), so screen-reader users get the same "where am I in the hierarchy" context sighted users get visually.
- **Mobile touch targets**: interactive elements — especially the continent/country tile grid, the Additional Features icon row, and any chart entries — need a minimum ~44×44px touch target on mobile.
- **Screen-reader-friendly hierarchy**: the Country Administration and Affiliate Pastors org-charts must expose their tiered structure to assistive technology (e.g. via heading levels or `aria` grouping per tier), not just visually via connector lines — a screen-reader user should be able to understand "Superintendent, then Assistant Superintendent and Secretary reporting to them" from the markup/structure, not only from the graphic.
- **Empty/placeholder states** (tying back to §5): every country-page section needs a real, announced empty-state message rather than a blank region, so assistive technology users aren't left wondering whether a section failed to load.

---

## 17. Image and Media Guidelines

- **Purpose-driven imagery only**: every image in the reference serves a specific storytelling or credibility purpose — the hero conveys mission/family/hope, the heritage photo conveys legacy, leadership photos convey real accountable people, institution photos convey tangible impact. **Avoid purely decorative imagery** that doesn't correspond to real organizational content (no generic stock photography standing in for people, places, or events that should be real).
- **Photography style by content type**:
  - *Mission/field photography* (hero, Missions section, institution photos): documentary, naturalistic, unfiltered.
  - *Historical photographs* (pioneers, heritage section): archival/portrait style, visually distinguished from current-day photography (see §8's cream-background pairing).
  - *Leadership/person photography* (International Administration, pastors, missionaries): consistent headshot framing and aspect ratio within any given grid.
  - *Institution/church photography*: landscape orientation, showing real buildings/places.
- **Country/flag imagery**: small flag icon/graphic per country, paired consistently with the country name in breadcrumbs and country headers (§4–§5).
- **Media source**: per `PROJECT_SPEC.md` §15, Cloudinary will handle logos, profile photographs, church/institution photographs, historical photographs, news/event images, and documents starting in **Phase 9** — this design specification assumes eventual Cloudinary-backed image URLs but does not require or imply any Cloudinary integration now. Until then, image handling in earlier phases should use clearly marked placeholder assets, never invented "real" photos.
- **Restraint**: consistent with §1.9, imagery supports content — it does not drive layout on its own (no full-page image carousels, no auto-playing background video implied anywhere in the reference).

---

## 18. Important Architectural Principle

**The design in this specification must never be implemented in a way that hardcodes organizational information into React components.**

Wrong:
```
CameroonPage.jsx
UgandaPage.jsx
KenyaPage.jsx
```

Right:
```
CountryPage.jsx  →  API  →  Country data  →  Reusable UI
```

This applies to every layer of the design described above, not just country pages:

- **Mission Locations / Country pages** (§4–§5): one `CountryPage` template, driven by route params + API data.
- **Country Administration / Affiliate Pastors Board** (§6–§7): one `LeadershipChart` component, driven by `CountryAdministration`/`AffiliatePastorsBoard` API data — the specific positions shown in the reference (Superintendent, Chairman, etc.) are example data, not values to hardcode into the component's JSX or logic.
- **People** (pioneers, pastors, missionaries, leadership): one `PersonCard`/`PioneerCard` component per §14, rendered from `Person` records — never a bespoke component per named individual.
- **Churches / Institutions**: one `OrganizationCard` and one directory pattern (§9), filtered by `type` and `country`, never a separate component per church or institution.
- **Ministries, News, Events**: rendered from their respective data models through shared card/list components, scoped by country or globally via query parameters — never authored as static per-country or per-item JSX.
- **History**: rendered from `HistoryEvent` records through the shared `Timeline` component (§8) — historical narrative text lives in the database, not in component source.

Any implementation phase that finds itself writing a country name, a person's name, an institution's name, or an organizational position title directly into a `.jsx` file (outside of this specification's illustrative examples) has deviated from both this document and `PROJECT_SPEC.md` and should be corrected before proceeding.

---

## 19. Design vs. Data

To keep `PROJECT_SPEC.md` and this document from ever drifting into contradiction, their responsibilities are kept strictly separate:

**`docs/PROJECT_SPEC.md` defines:**
- What the system is (purpose, scope, three logical areas).
- Data architecture (models: `Continent`, `Country`, `Person`, `Organization`, `Ministry`, `CountryAdministration`, `AffiliatePastorsBoard`, `HistoryEvent`, etc.).
- Business/functional requirements (roles, permissions, phase sequencing, "do not invent organizational data").

**`docs/DESIGN_SPEC.md` (this document) defines:**
- How the interface should look (color, typography, imagery, iconography — §1, §15, §17).
- How users navigate it (header/nav, breadcrumbs, mega-menus, mobile nav, route-level page structure — §2, §4, §13).
- Visual hierarchy (section banding, card patterns, heading scale — §1, §3).
- UI/UX behavior (component reuse, responsive transformation, accessibility — §13, §14, §16).

**Consistency check performed for this revision:** every data model, route pattern, position/role list, and phase boundary referenced in this document (Continents/Countries route structure in §4; `CountryAdministration` and `AffiliatePastorsBoard` position sets in §6–§7; the `Person`/`Organization`/`Ministry`/`HistoryEvent` model references throughout §5, §8, §9, §18; the Phase 9/Cloudinary boundary in §17; the "do not invent organizational data" rule reflected in §3 and §17) was cross-checked against the current `docs/PROJECT_SPEC.md` and found consistent. Neither document contradicts the other as of this revision. If a future implementation phase needs a UI pattern that would require a data-model change, that change belongs in `PROJECT_SPEC.md` first — this document should never silently imply a data requirement that `PROJECT_SPEC.md` doesn't already define.

---

## Decision Resolution Record (2026-09-08)

The six items previously listed as "Open Decisions Flagged for Approval" have been reviewed and resolved by the project owner. They are recorded here for traceability, split into decisions that are now final and decisions that are intentionally deferred to a later implementation phase. Nothing in this record authorizes any implementation work — it is a documentation-only resolution.

### Approved Design Decisions (Final)

1. **Main navigation — modified and finalized** (§2.2–§2.4). The primary nav bar stays exactly as shown in the reference: Home, About Us, Missions, Mission Locations, Church Institutions, Non-Church Institutions, Resources, plus the Donate CTA — no additional top-level items. Missionaries and News & Events are **not** added to the top-level bar; instead: Missions' dropdown gains Mission Areas, Missionaries, Ministries, Where We Serve; About Us' dropdown is Who We Are, Mission, Vision, Values, Beliefs, History, Leadership, Legal & Organizational Information; Resources' dropdown is News & Events, Resources, Prayer Requests. Contact remains accessible via the footer and utility/CTA areas rather than any dropdown.
2. **`wwm-cream` design token — approved** (§1.2, §15.1). Adopted for heritage/history/archival content (heritage sections, historical sections, pioneer/history content, historical-information callouts). The exact color value remains open only in the sense that it will be finalized against approved WWM visual assets during frontend implementation — the token's existence and intended usage are final.
4. **Country page navigation — approved with grouping** (§5). Rejected a flat 10+ item nav bar in favor of six grouped entries: Overview, Leadership (Country Administration, WWM Pastors, Affiliate Pastors), Churches & Institutions (Churches, Schools, Hospitals, Clinics, Bible Colleges, Other Institutions), Missionaries & Ministries (Missionaries, Ministries), News & Events, Contact. Must support sticky/anchor navigation where appropriate and must be responsive.
5. **Mobile organizational charts — approved** (§6, §7, §13). Desktop may use the reference's visual hierarchical chart. Mobile must not simply scale it down; it must use a vertical/tiered representation preserving hierarchy through grouping, indentation, or clearly separated leadership levels, from the same underlying data. The organizational structure remains data-driven and is never hardcoded into React, on either breakpoint.

### Decisions Deferred to a Later Phase

3. **Font family — deferred to Phase 4** (§1.3, §15.2). No specific typeface is locked at the specification stage. During Phase 4, evaluate a clean geometric/humanist sans-serif such as Inter, Work Sans, or Source Sans 3. This specification preserves the required typography *behavior* regardless of which family is ultimately chosen: strong heading hierarchy, professional navigation typography, clear body text, appropriate letter-spacing, and italic treatment for Scripture/quotes where appropriate.
6. **Global search — concept approved, implementation deferred** (§2.6, §14). The site should eventually support a global search capable of returning results across Countries, Churches, Institutions, People, Pastors, Missionaries, Ministries, News, Events, and Resources (e.g. a search for "Cameroon" surfacing the matching country plus related churches, institutions, people, and content). No search implementation, API, or visual interaction pattern is authorized now — both are to be finalized during the frontend implementation phase, with any backend/API implications reflected in `PROJECT_SPEC.md` before being built.

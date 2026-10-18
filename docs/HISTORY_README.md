# History section — founder-supplied content

Adds a dedicated, database-driven **Our History** page (`/history`) built from the founder's notes. Nothing historical is hardcoded in React: every statement is a `HistoryEvent` record you can edit in **Admin → History**.

## What was found in the repo
- The old History area (`/about#our-history`) was an empty placeholder. `HistoryEvent` was required by `docs/PROJECT_SPEC.md` §6/§12 but did not exist, so one new model was genuinely needed (no existing model could carry sections, images and private review flags).
- **No founder photographs are in the repository** (only the logo and hero image). The page shows labelled placeholders until photos are uploaded. No stock or generated images were used.

## Merge steps
1. Unzip over your project root (single `wwm/` folder, same as previous deliveries).
   - **If you have already applied the Phase 10 zip**, do not overwrite two files; extract everything else, then add the few lines shown below:
     `unzip -o wwm-history-section.zip -x "wwm/server/src/app.js" "wwm/client/src/App.jsx" -d /tmp/h && cp -r /tmp/h/wwm/. .`
     - `server/src/app.js`: add `import historyRouter from './routes/history.js';` and `app.use('/api/history', historyRouter);` next to the other public routers.
     - `client/src/AdminRoutes.jsx` (Phase 10): import `HistoryList` / `HistoryForm` from `./pages/admin/history/…` and add routes `history`, `history/new`, `history/:id` beside the Resources routes.
     - `client/src/App.jsx` (Phase 10): import `History from './pages/History.jsx'` and add `<Route path="/history" element={<History />} />` inside the public `<Layout>` routes.
2. `cd server && npm test` and `cd ../client && npm run build`.
3. Load the content (run deliberately, against the database you mean to write to):
   `cd server && npm run seed:history` — inserts the founder content as **published**; add `-- --draft` to insert it as drafts instead. Re-running never overwrites existing or edited entries. It links entries to **existing** People by name and lists any it could not match; it never creates people.
4. Upload the photographs (below), then review the entries in **Admin → History** (filter "Needs founder confirmation").
5. Append the documentation notes at the bottom of this file to `docs/PROGRESS.md`, `docs/PROJECT_SPEC.md` §12 and the `CLAUDE.md` status block.

## Photographs needed (upload through the admin; Cloudinary must be configured)
| Subject | Where to upload |
|---|---|
| Basil Miller portrait | Admin → History → "Basil Miller" → Photograph |
| Bearl and Virginia Smalldridge as a young couple | Admin → History → "Bearl and Virginia Smalldridge" → Photograph |
| Jonathan Smalldridge | Admin → People → his record → Photo (leadership timeline picks it up) |
| Rev. Ebai Aloysius | Admin → People → his record → Photo |
| **Rev. Anang Christopher Fang — replaces his current image** | Admin → People → his record → **Replace image** (the old asset is released safely if nothing else uses it) |
| Rev. Fred M. Johnson | Admin → History → "Rev. Fred M. Johnson" → Photograph |

Alt text and caption are set per entry in the same form. A group entry (the couple) never borrows one person's portrait.

## What the public page shows
Introduction · International origins (Basil Miller) · Mission in Cameroon (Smalldridge feature + milestones) · Leadership in Cameroon (vertical timeline, in the supplied order, with a note that dates/succession are shown only as supplied) · International leadership (Fred M. Johnson) · International growth (supplied expansion countries; **Brazil as "Information to come" only**) · Historical records (addresses and decree, framed as historical, not current). Claims are worded "the notes state…", with a "Source: Founder-supplied notes" line. Internal review labels are never sent by the public API or shown.

## Still unverified (flagged privately on each entry; none is externally verified)
- Basil Miller: birth date, Church of the Nazarene ministry, founding of the organization; ~200 books / thousands of articles / 35 years; *Heroine of Burma* published by World-Wide Missions in 1947.
- Smalldridges: 1960s commissioning as first missionary to Cameroon; 1928–2016; Bahamas/Liberia service; "over 50 churches" in West and East Cameroon; secondary school in 1969; "more than five years" as proprietors.
- Leadership: Jonathan Smalldridge (2008, Director); first and present/second WWMC superintendents; no appointment dates or fuller succession were supplied or inferred.
- Fred M. Johnson: 1985–2021 (36 years), "over 50 nations", the listed ministries.
- Expansion to Uganda, Kenya, India, the Philippines (no dates). Brazil: nothing beyond the founder's mention.
- Addresses (Pasadena; Muyuka P.O. Box 44) and whether any is still in use; Decree No. 71/DF/608 of 3 December 1971 and its exact legal wording.
- **Discrepancies with `docs/PROJECT_SPEC.md` §12, left unresolved and flagged:** the brief says "Mupundu-Muyuka" (spec: "Mpundu-Muyuka") and "Rev. Ebai Aloysius" (spec: "Rev. Elias A. Ebai"). The brief's wording is used. The spec's Basil Miller death date and original name ("Basil Miller Foundation Inc.") were not in the brief and are not shown.
- The introduction paragraph is editorial text written only from the notes: please confirm it.

## Files
Server (new): `models/HistoryEvent.js`, `routes/history.js`, `controllers/historyController.js`, `services/historyService.js`, `routes/admin/history.js`, `controllers/admin/historyAdminController.js`, `services/admin/historyAdminService.js`, `scripts/historySeedData.js`, `scripts/seedHistory.js`, `__tests__/historyEntries.test.js`.
Server (changed): `app.js`, `routes/admin.js`, `models/index.js`, `models/enums.js`, `services/mediaService.js` and `controllers/admin/mediaController.js` (new "history" image kind), `services/admin/personAdminService.js` and `countryAdminService.js` (a person/country used by a history entry can't be deleted), `__tests__/phase9Media.test.js` (also mocks the new collection), `package.json` (`seed:history` script).
Client (new): `pages/History.jsx`, `components/history/{Reveal,HistoryFeature,LeadershipTimeline,HistoricalRecords}.jsx`, `lib/history.js`, `pages/admin/history/{HistoryList,HistoryForm}.jsx`.
Client (changed): `App.jsx`, `pages/About.jsx` (teaser + link), `lib/navigation.js`, `components/home/{AdminBand,HeritageBand}.jsx` (links now go to `/history`), `components/admin/AdminSidebar.jsx`, `services/api.js`, `services/adminApi.js`.

## Notes to append to the project docs
**PROJECT_SPEC §12 addendum:** `HistoryEvent` is implemented. Fields: `section` (introduction, origins, cameroon, cameroon-leadership, international-leadership, records, international-growth), `entryType` (event/record/pending), `title`, `subtitle`, `description`, `year` (ordering only), `dateLabel` (display text), `approximateDate`, `historical`, `location`, `people[]`→Person, `country`→Country (for per-country history), `source` (public attribution), image (`imageUrl`, `imagePublicId`, `imageAlt`, `imageCaption`), `order`, `status` (draft/published), and **private** `reviewStatus`/`reviewNote`/`notes`. Public API `GET /api/history` returns only published entries without private fields. Admin: SUPER_ADMIN/INTERNATIONAL_ADMIN/CONTENT_EDITOR write; only the first two delete; COUNTRY_ADMIN read-only.
**PROGRESS.md:** History section implemented from founder-supplied content (see this file); all claims remain founder-supplied and unverified; photographs outstanding.
**CLAUDE.md status:** History page and `HistoryEvent` module added; content requires founder confirmation before being treated as verified.

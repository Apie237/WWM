# History seed text — professional rewrite: review report

Scope: the public narrative text of the seeded History entries only. Nothing about images, media, IDs, keys, sections, order, publication status, people links, the private review fields, the schema, the API or any component was changed.

## How it is applied

`npm run seed:history` only **inserts missing** entries, so records that were seeded earlier keep their old wording. Use the targeted text update instead:

```
cd server
npm run seed:history:check-text     # read-only: prints the database name/host (never credentials) and what would change
npm run seed:history:update-text    # applies it
```

`update-text` sets only `title`, `subtitle`, `description` and `dateLabel`, only on seed entries that already exist, and only where the stored text still equals the earlier seed wording exactly. A text edited in Admin → History is left alone and listed. It never creates or deletes entries, never touches `imageUrl`, `imagePublicId`, `imageAlt`, `imageCaption`, status, order, section, people, key or the review fields, and is safe to re-run. Run it against local development first; run it against production only deliberately, after `check-text`.

## Before → after (11 entries reworded, 4 unchanged)

### `intro` — Our History
**description**

- Before: World Wide Missions International traces its story through ministers, missionaries and Christian workers: from Basil Miller, a minister and author whose missionary writing connected believers around the world, to Bearl and Virginia Smalldridge, who served in Cameroon, and the leaders who have carried the work forward. The account below was supplied by the founder and is presented as the organization’s own history.
- After: World Wide Missions International traces its history through the ministers, missionaries and Christian workers who have shaped its work: from Basil Miller, a minister and author whose missionary writing connected believers around the world; to Bearl and Virginia Smalldridge, who served in Cameroon; and to the leaders who have carried the work forward.

### `basil-miller` — Basil Miller
**description**

- Before: The founder’s notes identify Basil Miller as a Church of the Nazarene minister, pastor, teacher and Christian author. They state that he later founded the mission organization that became World-Wide Missions, and that his missionary literature helped build connections with Christian workers around the world.
- After: Basil Miller was a Church of the Nazarene minister, pastor, teacher and Christian author. He later founded the mission organization that became World-Wide Missions, and his missionary literature helped build connections with Christian workers around the world.

**dateLabel**

- Before: Born February 26, 1897
- After: Born 26 February 1897

### `basil-miller-writing` — A writing ministry
**description**

- Before: The notes state that Basil Miller wrote approximately 200 books and thousands of articles over a 35-year writing career. They cite Heroine of Burma, published by World-Wide Missions in 1947.
- After: Over a writing career of 35 years, Basil Miller wrote approximately 200 books and thousands of articles. His published works include Heroine of Burma, issued by World-Wide Missions in 1947.

### `smalldridge-couple` — Bearl and Virginia Smalldridge
**description**

- Before: According to the founder’s notes, Bearl Darwin Smalldridge (1928–2016) was commissioned by WWMI as the first missionary to Cameroon in the 1960s. He and his wife, Virginia Smalldridge, moved to Cameroon after earlier mission work in the Bahamas and Liberia during the 1950s and 1960s.
- After: Bearl Darwin Smalldridge (1928–2016) was commissioned by WWMI in the 1960s as its first missionary to Cameroon. Together with his wife, Virginia Smalldridge, he relocated to Cameroon after earlier missionary service in the Bahamas and Liberia during the 1950s and 1960s.

### `churches-established` — Churches established
**description**

- Before: The notes state that Bearl and Virginia Smalldridge established over 50 churches across West and East Cameroon.
- After: Bearl and Virginia Smalldridge established more than 50 churches across West and East Cameroon.

### `secondary-school` — World Wide Missions Secondary School
**description**

- Before: The notes state that the Smalldridges founded the World Wide Missions Secondary School in Mupundu-Muyuka in 1969, and served as proprietors of the school for more than five years.
- After: In 1969 the Smalldridges founded the World Wide Missions Secondary School in Mupundu-Muyuka, and they served as its proprietors for more than five years.

### `jonathan-smalldridge` — Jonathan Smalldridge
**description**

- Before: The notes state that Jonathan Smalldridge returned to Cameroon in 2008 to continue his father’s mission and became Director of World Wide Missions Cameroon.
- After: Jonathan Smalldridge returned to Cameroon in 2008 to continue his father’s mission and became Director of World Wide Missions Cameroon.

### `ebai-superintendent` — Rev. Ebai Aloysius
**description**

- Before: Identified in the founder’s notes as the first official superintendent of World Wide Missions Cameroon (WWMC).
- After: Rev. Ebai Aloysius was the first official superintendent of World Wide Missions Cameroon (WWMC).

### `fang-superintendent` — Rev. Anang Christopher Fang
**description**

- Before: Identified in the founder’s notes as the present, or second, official superintendent of World Wide Missions Cameroon (WWMC).
- After: Rev. Anang Christopher Fang is the present, and second, official superintendent of World Wide Missions Cameroon (WWMC).

### `fred-johnson` — Rev. Fred M. Johnson
**description**

- Before: The notes state that Rev. Fred M. Johnson served for 36 years (1985–2021) as CEO of World-Wide Missions and directed support for churches and humanitarian ministries in over 50 nations, including Christian orphanages, schools, pastoral colleges, AIDS ministries, disaster relief and the provision of food, clothing and medicine.
- After: Rev. Fred M. Johnson served as CEO of World-Wide Missions for 36 years, from 1985 to 2021. He directed support for churches and humanitarian ministries in more than 50 nations, including Christian orphanages, schools, pastoral colleges, AIDS ministries, disaster relief and the provision of food, clothing and medicine.

### `expansion-countries` — Expansion to other countries
**description**

- Before: The notes state that mission work expanded to other countries, including Uganda, Kenya, India and the Philippines, after the Smalldridges had served as proprietors of the secondary school for more than five years.
- After: After the Smalldridges had served as proprietors of the secondary school for more than five years, mission work expanded to other countries, including Uganda, Kenya, India and the Philippines.

Unchanged on purpose: `brazil-pending` (public placeholder already neutral), and the three records `record-pasadena`, `record-cameroon`, `record-decree` (addresses and the quoted decree are shown exactly as supplied).

## Editorial rules applied

- Removed every research-note phrase from the public text ("According to the founder's notes", "The notes state", "Identified in the founder's notes", "They cite", "The founder's notes identify"), and the intro sentence saying the account "was supplied by the founder".
- Provenance was **not** deleted: it stays in each entry's internal *Source* field and in the private review fields (the public page no longer displays the Source field).
- Dates: "Born February 26, 1897" → "Born 26 February 1897" (day-month-year, as in the decree entry); "36 years (1985–2021)" → "36 years, from 1985 to 2021"; "over" → "more than". No approximate date was made exact; "1960s" and "during the 1950s and 1960s" are unchanged.
- The organization's names were **not** normalised: "World-Wide Missions" (hyphenated), "World Wide Missions" and "WWMI" are used exactly where the supplied material used them, because the name transition is itself an open question (see below).

## Still needs historical verification (private review notes already carry most of these)

1. **Heroine of Burma** — the notes cite it inside the writing-ministry entry. The new wording, "His published works include Heroine of Burma, issued by World-Wide Missions in 1947", relies on that context to attribute it to Basil Miller. Confirm authorship, title, publisher and year.
2. **"First missionary" vs "first missionaries"** — the description says Bearl Darwin Smalldridge was commissioned as WWMI's first missionary to Cameroon; the (unchanged) subtitle reads "First WWMI missionaries to Cameroon". Confirm whether the distinction matters.
3. **"WWMI" in the 1960s** — the supplied text says WWMI commissioned him; the organization appears elsewhere as World-Wide Missions / Basil Miller Foundation Inc. Confirm the name and the founding / name-transition dates (docs/PROJECT_SPEC.md §12 notes conflicting sources).
4. **Rev. Ebai Aloysius** vs "Rev. Elias A. Ebai" in docs/PROJECT_SPEC.md §12 — the brief's spelling is kept. Confirm the name and appointment date.
5. **Mupundu-Muyuka** (brief) vs "Mpundu-Muyuka" (PROJECT_SPEC) — the brief's spelling is kept.
6. **Rev. Anang Christopher Fang** is described as the present, and second, superintendent — "present" is relative to the supplied notes; confirm it still holds and the start date.
7. **Rev. Fred M. Johnson** — the founder asked for verification before publication: 1985–2021 (36 years), "more than 50 nations" and the list of ministries. Set the entry to Draft if it should not be public yet.
8. **Basil Miller** — birth date, Church of the Nazarene ministry, and that he founded the organization that became World-Wide Missions; "approximately 200 books", "thousands of articles", 35-year career.
9. **Smalldridge couple / school / churches** — 1960s commissioning, 1928–2016 life dates, Bahamas and Liberia service dates, "more than 50 churches" in West and East Cameroon, the 1969 founding and "more than five years" as proprietors.
10. **Expansion** — Uganda, Kenya, India and the Philippines, and the timing relative to the school (no dates were supplied).
11. **Brazil** — no facts were supplied; the placeholder stays a placeholder.
12. **Records** — whether the Pasadena address and the Muyuka headquarters / P.O. Box 44 are still in use, and the exact decree wording. They are never described as current.
13. The intro's connective "who have shaped its work" is light editorial framing added to the earlier sentence; it adds no fact, but confirm the founder is happy with it.

## Left alone deliberately (your call)

- The *Source* field of each entry ("Founder-supplied notes" / "Founder-supplied records") is kept as an internal provenance note. It is no longer displayed on the public History page (the "Source: …" lines were removed from every History component), and it is still editable in Admin → History.
- The fixed notices in `client/src/pages/History.jsx` (the records notice and the leadership-succession note). They are page text, not seed data, and they keep historical addresses from being read as current.

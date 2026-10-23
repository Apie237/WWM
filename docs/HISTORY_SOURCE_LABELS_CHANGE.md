# History page: public "Source:" labels removed

**What visitors no longer see:** the "Source: Founder-supplied notes" / "Source: Founder-supplied records" line under History entries. It was rendered in five places and all five were removed:

- `components/history/HistoryFeature.jsx` (origins, Cameroon feature, international leadership)
- `components/history/LeadershipTimeline.jsx` (Leadership in Cameroon)
- `components/history/HistoricalRecords.jsx` (Historical records)
- `pages/History.jsx` — the secondary Cameroon cards and the international-growth cards

**Why it stays gone:** the fix is in the display code, not in the data. The `source` value is still stored on every entry (and in the seed) as an internal provenance note, and is still editable in Admin → History, where the field is now labelled "Source (internal — not shown on the public site)". Because nothing on the public page reads it, it cannot reappear after `npm run seed:history`, `npm run seed:history:update-text`, or an edit in the admin, and it is also gone for records already in the database (no data change or reseed is needed).

**Not changed:** narratives, titles, subtitles, captions, dates, section, order, status, IDs, people links, image fields, schema, API, auth, uploads, Cloudinary. Edits to `HistoryEvent.js` and `historySeedData.js` are comments only.

**Still visible, by design (not "Source:" labels):** the fixed notices on the History page — the records notice ("historical details supplied by the founder…") and the leadership-succession note ("…shown only as supplied…"). They keep historical addresses from being read as current. Say if you want them reworded.

**Note:** the `source` string is still part of the public API's JSON response for an entry (the API contract was not changed); it just isn't displayed. Excluding it from the public projection would be a small server change if you want it hidden there too.

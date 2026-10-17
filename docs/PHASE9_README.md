# Phase 9 — Media Management & Cloudinary

## What it does
Admins upload JPEG, PNG or WebP images from the News, Event, Person and Country forms. The server validates and signs the upload to Cloudinary; the record stores the Cloudinary public ID and a server-built URL. Public pages show width-limited renditions.

## Setup (manual step required)
Add to `server/.env` (and to your Vercel project settings):

```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MEDIA_MAX_UPLOAD_MB=4   # optional; keep <= 4 on Vercel
```

Without them the app runs normally: uploads answer 503 and the forms fall back to a plain image-link input. No dependency changes; run no extra installs.

## Rules
- Types: JPEG, PNG, WebP (checked by file content, not only the label). Max 4 MB by default.
- Auth required; 60 uploads/hour per admin; roles follow who can edit the module (country flags exclude CONTENT_EDITOR).
- Country admins can only change media on their own country's records (existing ownership checks).
- An asset used by another record can't be attached; Cloudinary assets are deleted only after the DB save and only when unreferenced; deletion failures never fail the edit.

## API
`GET /api/admin/media/config` · `POST /api/admin/media/upload/:kind` (`news|events|people|countries`, raw body, `Content-Type: image/jpeg|png|webp`).

## Changed / new files
Server: `config/env.js`, `models/{News,Event,Person,Country}.js`, `routes/admin.js`, `routes/admin/media.js`, `controllers/admin/mediaController.js`, `services/mediaService.js`, `services/admin/{contentAdmin,news,event,person,country}AdminService.js`, `.env.example`, tests `phase9Media.test.js` + `helpers/smallUploadLimit.js`.
Client: `services/adminApi.js`, `components/admin/cms/ImageUpload.jsx`, `lib/images.js`, the four admin forms, and the public cards/pages that render images.
Docs: `PROGRESS.md`, `PROJECT_SPEC.md`, `CLAUDE.md`, this file.

## Testing
`cd server && npm test` (Cloudinary is mocked), `cd client && npm run build && npx oxlint`. To test for real, set the three variables, log in as an admin and upload from a News form.

## Limitations
Live Cloudinary was not verified; orphaned uploads aren't swept; no alt-text field; Resource documents are deferred.

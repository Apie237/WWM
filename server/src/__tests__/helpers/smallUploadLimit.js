// Imported FIRST by the Phase 9 media tests. config/env.js reads
// MEDIA_MAX_UPLOAD_MB at load, so this makes the upload cap ~1 KB for that
// test process only, letting the "oversized image" test use a tiny buffer.
process.env.MEDIA_MAX_UPLOAD_MB = '0.001';

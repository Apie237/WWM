// Imported FIRST by tests that make many public POSTs. config/env.js reads
// PUBLIC_SUBMISSION_LIMIT at load, so this raises the per-IP cap for that test
// process only. The dedicated rate-limit test does NOT import this file, so it
// exercises the real default (5/hour). node --test runs each file in its own
// process, so the two settings never mix.
process.env.PUBLIC_SUBMISSION_LIMIT = '1000';

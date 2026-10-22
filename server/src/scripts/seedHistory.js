// Seeds the founder-supplied history (see historySeedData.js).
//
//   npm run seed:history                     insert missing entries as PUBLISHED
//   npm run seed:history -- --draft          insert missing entries as DRAFT
//   npm run seed:history:check               READ-ONLY: show which database this
//                                            script reaches and what it contains
//   npm run seed:history:publish             publish seed entries that exist but
//                                            are still DRAFT (explicit opt-in)
//
// Safe to re-run: entries are matched by `key` and only INSERTED when missing —
// anything already in the database (including edits made in the admin, and the
// draft/published status) is never overwritten by the normal run. People are
// linked to EXISTING Person records by display name; the script never creates
// a Person and never touches Cloudinary. Run it deliberately against the
// database you mean to write to: it prints the database name and host (never
// the credentials) before doing anything, and reports the REAL state afterwards.
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { HistoryEvent, Person } from '../models/index.js';
import { HISTORY_SEED } from './historySeedData.js';

export const SEED_KEYS = HISTORY_SEED.map((e) => e.key);

const norm = (s) => s.toLowerCase().replace(/\b(rev|dr|pastor|mr|mrs)\.?\s+/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export async function resolvePeople(names, directory) {
  const ids = [];
  const missing = [];
  for (const name of names || []) {
    const hit = directory.get(norm(name));
    if (hit && hit.length === 1) ids.push(hit[0]);
    else missing.push(hit && hit.length > 1 ? `${name} (ambiguous: ${hit.length} matches)` : name);
  }
  return { ids, missing };
}

// What the database actually holds, compared with the seed. Pure, so it can be
// tested without a database. `docs` are { key, status } rows.
export function summarizeState(docs) {
  const byKey = new Map(docs.filter((d) => d.key).map((d) => [d.key, d]));
  const present = SEED_KEYS.filter((k) => byKey.has(k));
  return {
    total: docs.length,
    published: docs.filter((d) => d.status === 'published').length,
    draft: docs.filter((d) => d.status !== 'published').length,
    seedMissing: SEED_KEYS.filter((k) => !byKey.has(k)),
    seedDraft: present.filter((k) => byKey.get(k).status !== 'published'),
    seedPublished: present.filter((k) => byKey.get(k).status === 'published'),
  };
}

export function describeState(state) {
  const lines = [
    `Entries in this database: ${state.total} (${state.published} published, ${state.draft} draft).`,
    `Seed entries: ${state.seedPublished.length} published, ${state.seedDraft.length} draft, ${state.seedMissing.length} not present (of ${SEED_KEYS.length}).`,
  ];
  if (state.seedDraft.length) {
    lines.push(
      `WARNING: ${state.seedDraft.length} seed entries exist as DRAFT, so the public page and GET /api/history do not show them:`,
      `  ${state.seedDraft.join(', ')}`,
      '  Publish them in Admin → History, or run: npm run seed:history:publish'
    );
  }
  if (state.seedMissing.length && state.seedMissing.length < SEED_KEYS.length) {
    lines.push(`Missing seed entries: ${state.seedMissing.join(', ')} (run: npm run seed:history)`);
  }
  if (state.seedMissing.length === SEED_KEYS.length) {
    lines.push('None of the seed entries exist in this database yet (run: npm run seed:history).');
  }
  return lines;
}

async function readState() {
  return summarizeState(await HistoryEvent.find({}).select('key status').lean());
}

// mode: 'insert' | 'draft' | 'check' | 'publish'. The database connection is the
// caller's job, so this can be tested with the models mocked.
export async function runSeed({ mode = 'insert', log = console.log } = {}) {
  if (mode === 'check') {
    describeState(await readState()).forEach((l) => log(`[seed:history] ${l}`));
    log('[seed:history] Read-only check: nothing was changed.');
    return;
  }

  if (mode === 'publish') {
    // Only entries that belong to the seed (by key) and are not yet published.
    const res = await HistoryEvent.updateMany(
      { key: { $in: SEED_KEYS }, status: { $ne: 'published' } },
      { $set: { status: 'published' } }
    );
    log(`[seed:history] published ${res.modifiedCount ?? 0} seed entries that were drafts.`);
    describeState(await readState()).forEach((l) => log(`[seed:history] ${l}`));
    return;
  }

  const asDraft = mode === 'draft';
  const directory = new Map();
  for (const p of await Person.find({}).select('displayName').lean()) {
    const k = norm(p.displayName || '');
    directory.set(k, [...(directory.get(k) || []), p._id]);
  }

  const unmatched = new Set();
  let created = 0;
  let kept = 0;
  for (const entry of HISTORY_SEED) {
    const { people: names, ...fields } = entry;
    const { ids, missing } = await resolvePeople(names, directory);
    missing.forEach((m) => unmatched.add(m));
    const res = await HistoryEvent.updateOne(
      { key: entry.key },
      { $setOnInsert: { ...fields, people: ids, status: asDraft ? 'draft' : 'published' } },
      { upsert: true }
    );
    if (res.upsertedCount) created++;
    else kept++;
  }

  // The flag only decides the status of NEWLY created entries; entries that
  // already existed keep whatever status they have. Report what is really there.
  log(`[seed:history] created ${created} new ${asDraft ? 'draft' : 'published'} entries; left ${kept} existing entries untouched.`);
  describeState(await readState()).forEach((l) => log(`[seed:history] ${l}`));
  if (unmatched.size) {
    log('[seed:history] No Person record matched these names, so they are not linked yet:');
    for (const n of unmatched) log(`  - ${n}`);
    log('  Add them in Admin → People, then link them on the History entry.');
  }
}

export function modeFromArgs(argv) {
  const flags = argv.filter((a) => a.startsWith('--'));
  const known = ['--draft', '--check', '--publish-seeded'];
  const unknown = flags.filter((f) => !known.includes(f));
  if (unknown.length) throw new Error(`Unknown option(s): ${unknown.join(', ')}. Allowed: ${known.join(', ')}.`);
  if (flags.length > 1) throw new Error('Use only one of --draft, --check, --publish-seeded.');
  if (flags[0] === '--check') return 'check';
  if (flags[0] === '--publish-seeded') return 'publish';
  if (flags[0] === '--draft') return 'draft';
  return 'insert';
}

async function main() {
  const mode = modeFromArgs(process.argv.slice(2));
  await connectDB();
  // Name and host only — never the connection string or credentials.
  console.log(`[seed:history] database: "${mongoose.connection.name}" on ${mongoose.connection.host}`);
  await runSeed({ mode });
  await mongoose.disconnect();
}

// Run only when executed directly (the tests import the helpers).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seedHistory.js')) {
  main().catch(async (err) => {
    console.error('[seed:history] failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

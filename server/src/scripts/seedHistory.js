// Seeds the founder-supplied history (see historySeedData.js).
//
//   npm run seed:history              insert missing entries as PUBLISHED
//   npm run seed:history -- --draft   insert missing entries as DRAFT
//
// Safe to re-run: entries are matched by `key` and only INSERTED when missing —
// anything already in the database (including edits made in the admin) is never
// overwritten. People are linked to EXISTING Person records by display name;
// the script never creates a Person and never touches Cloudinary. Run it
// deliberately against the database you mean to write to.
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { HistoryEvent, Person } from '../models/index.js';
import { HISTORY_SEED } from './historySeedData.js';

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

async function main() {
  const asDraft = process.argv.includes('--draft');
  await connectDB();

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

  console.log(`[seed:history] created ${created}, left ${kept} existing entries untouched (${asDraft ? 'as draft' : 'published'}).`);
  if (unmatched.size) {
    console.log('[seed:history] No Person record matched these names, so they are not linked yet:');
    for (const n of unmatched) console.log(`  - ${n}`);
    console.log('  Add them in Admin → People, then link them on the History entry.');
  }
  await mongoose.disconnect();
}

// Run only when executed directly (the tests import resolvePeople).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seedHistory.js')) {
  main().catch(async (err) => {
    console.error('[seed:history] failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

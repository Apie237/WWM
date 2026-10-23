// The professional rewrite of the History seed text, and the safe way to apply
// it to records that were seeded earlier. MongoDB is replaced by a small
// in-memory collection that honours the exact filters/updates the seeder sends,
// so the tests prove what the update does and does NOT touch (images, ids,
// status, order, section, people, review fields, record count).
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HistoryEvent } from '../models/index.js';
import { HISTORY_SEED } from '../scripts/historySeedData.js';
import { LEGACY_TEXT } from '../scripts/historySeedLegacy.js';
import { runSeed, planTextUpdates, TEXT_FIELDS } from '../scripts/seedHistory.js';

const IMAGE_FIELDS = ['imageUrl', 'imagePublicId', 'imageAlt', 'imageCaption'];
const silent = { log: () => {} };

// Rows as an earlier deployment would hold them: the OLD wording from the
// legacy table, plus data the seed never owns (images, ids, review notes...).
function legacyRows() {
  return HISTORY_SEED.map((seed, i) => {
    const row = { _id: `id-${i}`, ...seed };
    delete row.people;
    for (const [f, old] of Object.entries(LEGACY_TEXT[seed.key] || {})) row[f] = old;
    Object.assign(row, {
      status: i % 2 ? 'published' : 'draft',
      people: [`person-${i}`],
      imageUrl: `https://res.cloudinary.com/x/image/upload/f_auto,q_auto/wwm/history/${String(i).padStart(32, '0')}`,
      imagePublicId: `wwm/history/${String(i).padStart(32, '0')}`,
      imageAlt: `alt ${i}`,
      imageCaption: `caption ${i}`,
    });
    return row;
  });
}

const orig = { find: HistoryEvent.find, updateOne: HistoryEvent.updateOne, updateMany: HistoryEvent.updateMany };
let rows; let calls;
beforeEach(() => {
  rows = legacyRows();
  calls = { updateOne: [], updateMany: 0, other: 0 };
  HistoryEvent.find = (filter = {}) => {
    const keys = filter.key?.$in;
    const chain = {
      select: () => chain,
      lean: async () => rows.filter((r) => !keys || keys.includes(r.key)).map((r) => ({ ...r })),
    };
    return chain;
  };
  HistoryEvent.updateOne = async (filter, update) => {
    calls.updateOne.push({ filter, update });
    const hit = rows.find((r) => Object.entries(filter).every(([k, v]) => r[k] === v));
    if (!hit) return { modifiedCount: 0 };
    assert.deepEqual(Object.keys(update), ['$set'], 'only $set is ever used');
    Object.assign(hit, update.$set);
    return { modifiedCount: 1 };
  };
  HistoryEvent.updateMany = async () => { calls.updateMany++; return { modifiedCount: 0 }; };
});
afterEach(() => { Object.assign(HistoryEvent, orig); });

const snapshot = () => rows.map((r) => ({ ...r }));
const stripText = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => !TEXT_FIELDS.includes(k)));

describe('the rewritten seed text', () => {
  test('there are exactly 15 entries and 11 of them were reworded; records and the Brazil placeholder are untouched', () => {
    assert.equal(HISTORY_SEED.length, 15);
    assert.equal(Object.keys(LEGACY_TEXT).length, 11);
    for (const k of ['brazil-pending', 'record-pasadena', 'record-cameroon', 'record-decree']) assert.equal(LEGACY_TEXT[k], undefined, k);
  });
  test('image fields in the seed are exactly what they were before the rewrite (alt text and caption unchanged, no URLs or ids)', () => {
    const images = Object.fromEntries(
      HISTORY_SEED.map((e) => [e.key, Object.fromEntries(IMAGE_FIELDS.filter((f) => e[f] !== undefined).map((f) => [f, e[f]]))]).filter(([, v]) => Object.keys(v).length),
    );
    assert.deepEqual(images, {
      'basil-miller': { imageAlt: 'Portrait of Basil Miller' },
      'smalldridge-couple': { imageAlt: 'Bearl and Virginia Smalldridge as a young couple', imageCaption: 'Bearl and Virginia Smalldridge' },
      'fred-johnson': { imageAlt: 'Portrait of Rev. Fred M. Johnson' },
    });
  });
  test('ordering, sections and keys are exactly what they were', () => {
    assert.deepEqual(
      HISTORY_SEED.map((e) => `${e.key}|${e.section}|${e.order}`),
      ['intro|introduction|0', 'basil-miller|origins|10', 'basil-miller-writing|origins|20', 'smalldridge-couple|cameroon|10', 'churches-established|cameroon|20',
        'secondary-school|cameroon|30', 'jonathan-smalldridge|cameroon-leadership|10', 'ebai-superintendent|cameroon-leadership|20', 'fang-superintendent|cameroon-leadership|30',
        'fred-johnson|international-leadership|10', 'expansion-countries|international-growth|10', 'brazil-pending|international-growth|20',
        'record-pasadena|records|10', 'record-cameroon|records|20', 'record-decree|records|30'],
    );
  });
  test('no seeded public text contains an editorial or research-note phrase', () => {
    const editorial = /according to|notes state|founder['’]s notes|the notes\b|records indicate|it is said|available information|reportedly|identified in/i;
    for (const e of HISTORY_SEED) assert.ok(!editorial.test(`${e.title} ${e.subtitle || ''} ${e.description || ''} ${e.dateLabel || ''}`), e.key);
  });
  test('the earlier wording really did contain such phrases (the legacy table is the real "before")', () => {
    const editorial = /according to|notes state|founder['’]s notes|the notes\b|identified in/i;
    const hits = Object.values(LEGACY_TEXT).filter((f) => editorial.test(f.description || ''));
    assert.ok(hits.length >= 9, `only ${hits.length}`);
  });
});

describe('update-text: planning', () => {
  test('rows holding the earlier wording are planned for update; nothing else', () => {
    const plan = planTextUpdates(rows);
    assert.equal(plan.updates.length, 11);
    assert.deepEqual(plan.edited, []);
    assert.deepEqual(plan.missing, []);
    assert.equal(plan.upToDate.length, 4);
    for (const u of plan.updates) assert.ok(Object.keys(u.set).every((f) => TEXT_FIELDS.includes(f)));
  });
  test('a text edited in the admin is left alone and reported', () => {
    rows.find((r) => r.key === 'fred-johnson').description = 'Edited by an administrator.';
    const plan = planTextUpdates(rows);
    assert.equal(plan.updates.length, 10);
    assert.deepEqual(plan.edited, [{ key: 'fred-johnson', fields: ['description'] }]);
  });
  test('a missing seed entry is reported, never created', () => {
    rows = rows.filter((r) => r.key !== 'intro');
    assert.deepEqual(planTextUpdates(rows).missing, ['intro']);
  });
});

describe('update-text: applying it', () => {
  test('--check-text is read-only: it writes nothing', async () => {
    const before = snapshot();
    const out = [];
    await runSeed({ mode: 'check-text', log: (l) => out.push(l) });
    assert.deepEqual(rows, before);
    assert.equal(calls.updateOne.length + calls.updateMany, 0);
    assert.match(out.join('\n'), /Text updates available: 11 entries/);
    assert.match(out.join('\n'), /Read-only check/);
  });

  test('--update-text rewrites the 11 texts and changes nothing else', async () => {
    const before = snapshot();
    const out = [];
    await runSeed({ mode: 'update-text', log: (l) => out.push(l) });
    assert.equal(rows.length, before.length, 'record count unchanged');
    assert.equal(calls.updateMany, 0);
    assert.equal(calls.updateOne.length, 11);
    const seedBy = Object.fromEntries(HISTORY_SEED.map((e) => [e.key, e]));
    rows.forEach((row, i) => {
      // every field except the text fields is byte-for-byte identical
      assert.deepEqual(stripText(row), stripText(before[i]), row.key);
      for (const f of IMAGE_FIELDS) assert.equal(row[f], before[i][f], `${row.key}.${f}`);
      for (const f of ['_id', 'key', 'section', 'order', 'status', 'people', 'reviewStatus', 'reviewNote', 'notes', 'source', 'entryType']) {
        assert.deepEqual(row[f], before[i][f], `${row.key}.${f}`);
      }
      // and every text field now equals the current seed
      for (const f of TEXT_FIELDS) assert.equal(String(row[f] ?? ''), String(seedBy[row.key][f] ?? ''), `${row.key}.${f}`);
    });
    assert.match(out.join('\n'), /updated the text of 11 entries/);
    assert.match(out.join('\n'), /Already on the current wording: 15/);
  });

  test('it is idempotent: a second run changes nothing and issues no writes', async () => {
    await runSeed({ mode: 'update-text', ...silent });
    const after = snapshot();
    calls.updateOne = [];
    const out = [];
    await runSeed({ mode: 'update-text', log: (l) => out.push(l) });
    assert.deepEqual(rows, after);
    assert.equal(calls.updateOne.length, 0);
    assert.match(out.join('\n'), /updated the text of 0 entries/);
  });

  test('an admin edit survives, and so do all images; only untouched texts are upgraded', async () => {
    const edited = rows.find((r) => r.key === 'smalldridge-couple');
    edited.description = 'A hand-edited description.';
    edited.imageCaption = 'Edited caption';
    await runSeed({ mode: 'update-text', ...silent });
    assert.equal(edited.description, 'A hand-edited description.');
    assert.equal(edited.imageCaption, 'Edited caption');
    assert.equal(calls.updateOne.length, 10);
  });

  test('a concurrent edit between reading and writing makes that update a no-op (the filter pins the stored text)', async () => {
    const realFind = HistoryEvent.find;
    HistoryEvent.find = (f) => {
      const chain = realFind(f);
      const lean = chain.lean;
      chain.lean = async () => {
        const result = await lean();
        const target = rows.find((r) => r.key === 'intro');
        if (target) target.description = 'Edited while the script was running.';
        return result;
      };
      return chain;
    };
    await runSeed({ mode: 'update-text', ...silent });
    HistoryEvent.find = realFind;
    assert.equal(rows.find((r) => r.key === 'intro').description, 'Edited while the script was running.');
  });

  test('it never creates entries: a database without the seed is left empty', async () => {
    rows = [];
    await runSeed({ mode: 'update-text', ...silent });
    assert.equal(rows.length, 0);
    assert.equal(calls.updateOne.length, 0);
  });
});

describe('the seeder source never writes media or structural fields in text mode', () => {
  test('update-text issues only { $set: <text fields> } filtered by key + stored text', async () => {
    await runSeed({ mode: 'update-text', ...silent });
    for (const { filter, update } of calls.updateOne) {
      assert.ok(filter.key);
      assert.ok(Object.keys(update.$set).every((f) => TEXT_FIELDS.includes(f)), JSON.stringify(Object.keys(update.$set)));
      assert.ok(!Object.keys(update.$set).some((f) => /image|status|order|section|people|key|review/i.test(f)));
    }
  });
});

describe('the command-line entry point', () => {
  test('npm scripts exist for check-text and update-text', async () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse((await import('node:fs')).readFileSync(path.join(dir, '../../package.json'), 'utf8'));
    assert.equal(pkg.scripts['seed:history:check-text'], 'node src/scripts/seedHistory.js --check-text');
    assert.equal(pkg.scripts['seed:history:update-text'], 'node src/scripts/seedHistory.js --update-text');
    void execFileSync; // (no process is spawned: a real run needs a database)
  });
});

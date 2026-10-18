// History section tests: public API privacy, admin authorization/validation,
// image-kind rules, reference protection, and the integrity of the supplied
// founder content. Same conventions as earlier phases (real Express app over
// real HTTP, Mongoose model methods mocked, no MongoDB needed).
import { test, describe, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { signAdminToken } from '../services/authService.js';
import { HistoryEvent, Person, Country, User, Organization, Ministry, CountryAdministration, AffiliatePastorsBoard } from '../models/index.js';
import { HISTORY_SECTIONS } from '../models/enums.js';
import { HISTORY_SEED } from '../scripts/historySeedData.js';
import { resolvePeople } from '../scripts/seedHistory.js';
import { isValidPublicId } from '../services/mediaService.js';

const oid = () => new mongoose.Types.ObjectId().toString();
let server; let base;
before(async () => {
  server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

async function api(method, path, { body, token, headers = {} } = {}) {
  const isBuf = Buffer.isBuffer(body);
  const res = await fetch(base + path, {
    method,
    headers: { ...(isBuf || body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : isBuf ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text };
}
const origFindById = User.findById;
function asAdmin(role, countryId = null) {
  const user = { _id: new mongoose.Types.ObjectId(), name: 'T', email: 't@x.test', role, isActive: true, country: countryId ? { _id: new mongoose.Types.ObjectId(countryId), name: 'C', slug: 'c' } : null };
  User.findById = () => ({ populate: async () => user });
  return signAdminToken({ ...user, country: countryId ? new mongoose.Types.ObjectId(countryId) : null });
}
const quiet = async (fn) => { const e = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = e; } };

describe('public API — /api/history', () => {
  const orig = { find: HistoryEvent.find, count: HistoryEvent.countDocuments, cfind: Country.findOne };
  afterEach(() => { HistoryEvent.find = orig.find; HistoryEvent.countDocuments = orig.count; Country.findOne = orig.cfind; });
  function capture(rows = []) {
    const seen = { filter: null, select: null, limit: null };
    HistoryEvent.find = (filter) => {
      seen.filter = filter;
      const chain = {
        select: (s) => { seen.select = s; return chain; }, populate: () => chain, sort: () => chain,
        limit: (n) => { seen.limit = n; return chain; }, lean: async () => rows,
      };
      return chain;
    };
    HistoryEvent.countDocuments = async () => rows.length;
    return seen;
  }

  test('only published entries are queried, and every private field is excluded', async () => {
    const seen = capture([{ _id: oid(), title: 'x' }]);
    const r = await api('GET', '/api/history');
    assert.equal(r.status, 200);
    assert.equal(seen.filter.status, 'published');
    for (const field of ['notes', 'reviewStatus', 'reviewNote', 'imagePublicId']) {
      assert.match(seen.select, new RegExp(`-${field}\\b`), `${field} must be excluded`);
    }
  });
  test('needs no authentication; result size is bounded', async () => {
    const seen = capture();
    assert.equal((await api('GET', '/api/history?limit=100000')).status, 200);
    assert.equal(seen.limit, 200);
  });
  test('section filter is validated against the allowed list', async () => {
    capture();
    assert.equal((await api('GET', '/api/history?section=cameroon')).status, 200);
    assert.equal((await api('GET', '/api/history?section=secret')).status, 400);
    assert.equal((await api('GET', '/api/history?section=a&section=b')).status, 400);
  });
  test('a known country slug restricts the query to that country, still published only', async () => {
    const seen = capture([{ _id: oid(), title: 'x' }]);
    const countryId = new mongoose.Types.ObjectId();
    Country.findOne = () => ({ select: () => ({ lean: async () => ({ _id: countryId, name: 'Cameroon', slug: 'cameroon' }) }) });
    const r = await api('GET', '/api/history?country=cameroon');
    assert.equal(r.status, 200);
    assert.equal(seen.filter.status, 'published');
    assert.equal(String(seen.filter.country), String(countryId));
    assert.equal((await api('GET', '/api/history?country[$ne]=x')).status, 200, 'operator syntax is only a literal key');
    assert.equal((await api('GET', '/api/history?country=a&country=b')).status, 400);
  });
  test('an unknown country slug yields an empty list, not an error', async () => {
    capture();
    Country.findOne = () => ({ select: () => ({ lean: async () => null }) });
    const r = await api('GET', '/api/history?country=atlantis');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, []);
  });
});

describe('admin API — authorization', () => {
  afterEach(() => { User.findById = origFindById; });
  test('unauthenticated requests are rejected', async () => {
    assert.equal((await api('GET', '/api/admin/history')).status, 401);
    assert.equal((await api('POST', '/api/admin/history', { body: { title: 'x', section: 'origins' } })).status, 401);
  });
  test('COUNTRY_ADMIN is read-only; CONTENT_EDITOR cannot delete', async () => {
    const ca = asAdmin('COUNTRY_ADMIN', oid());
    assert.equal((await api('POST', '/api/admin/history', { token: ca, body: { title: 'x', section: 'origins' } })).status, 403);
    assert.equal((await api('PATCH', `/api/admin/history/${oid()}`, { token: ca, body: { title: 'y' } })).status, 403);
    assert.equal((await api('DELETE', `/api/admin/history/${oid()}`, { token: ca })).status, 403);
    const ce = asAdmin('CONTENT_EDITOR');
    assert.equal((await api('DELETE', `/api/admin/history/${oid()}`, { token: ce })).status, 403);
  });
});

describe('admin API — validation and mass assignment', () => {
  const origSave = HistoryEvent.prototype.save; const origPC = Person.countDocuments; const origCE = Country.exists;
  afterEach(() => { User.findById = origFindById; HistoryEvent.prototype.save = origSave; Person.countDocuments = origPC; Country.exists = origCE; });
  const create = (body, role = 'CONTENT_EDITOR') => api('POST', '/api/admin/history', { token: asAdmin(role), body });

  test('a valid entry is created; key, _id, createdAt and unknown fields are ignored', async () => {
    let saved;
    HistoryEvent.prototype.save = async function s() { saved = this; return this; };
    const r = await create({ title: 'T', section: 'cameroon', key: 'hijack', _id: oid(), createdAt: '2000-01-01', evil: 1, reviewStatus: 'needs_confirmation', status: 'draft' });
    assert.equal(r.status, 201, r.text);
    assert.equal(saved.key, undefined);
    assert.equal(saved.reviewStatus, 'needs_confirmation');
    assert.equal(saved.get('evil'), undefined);
  });
  test('required and enum fields are enforced', async () => {
    assert.equal((await create({ section: 'origins' })).status, 400);
    assert.equal((await create({ title: 'T' })).status, 400);
    assert.equal((await create({ title: 'T', section: 'nope' })).status, 400);
    assert.equal((await create({ title: 'T', section: 'origins', entryType: 'weird' })).status, 400);
    assert.equal((await create({ title: 'T', section: 'origins', reviewStatus: 'verified-by-god' })).status, 400);
    assert.equal((await create({ title: 'T', section: 'origins', status: 'live' })).status, 400);
  });
  test('year, flags and people are validated', async () => {
    assert.equal((await create({ title: 'T', section: 'origins', year: 3000 })).status, 400);
    assert.equal((await create({ title: 'T', section: 'origins', year: 19.5 })).status, 400);
    assert.equal((await create({ title: 'T', section: 'origins', approximateDate: 'yes' })).status, 400);
    assert.equal((await create({ title: 'T', section: 'origins', people: 'abc' })).status, 400);
    assert.equal((await create({ title: 'T', section: 'origins', people: ['not-an-id'] })).status, 400);
    Person.countDocuments = async () => 0;
    assert.equal((await create({ title: 'T', section: 'origins', people: [oid()] })).status, 400);
    Country.exists = async () => null;
    assert.equal((await create({ title: 'T', section: 'origins', country: oid() })).status, 400);
  });
  test('over-long text is rejected', async () => {
    assert.equal((await create({ title: 'T', section: 'origins', description: 'x'.repeat(5001) })).status, 400);
  });
  test('an image id must be a history-kind Cloudinary id (no other kind, no URLs)', async () => {
    assert.equal((await create({ title: 'T', section: 'origins', imagePublicId: `wwm/news/${crypto.randomBytes(16).toString('hex')}` })).status, 400);
    assert.equal((await create({ title: 'T', section: 'origins', imagePublicId: 'https://evil.example/x.png' })).status, 400);
  });
});

describe('history images (Phase 9 media integration)', () => {
  afterEach(() => { User.findById = origFindById; });
  const hex = () => crypto.randomBytes(16).toString('hex');
  test('"history" is a valid media kind; ids for other kinds are not history ids', () => {
    assert.ok(isValidPublicId(`wwm/history/${hex()}`, 'history'));
    assert.ok(!isValidPublicId(`wwm/news/${hex()}`, 'history'));
    assert.ok(!isValidPublicId(`wwm/history/${hex()}`, 'news'));
  });
  test('upload roles for history: editors/international admins yes, COUNTRY_ADMIN no, unauthenticated no', async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(30)]);
    const up = (token) => api('POST', '/api/admin/media/upload/history', { token, body: png, headers: { 'content-type': 'image/png' } });
    assert.equal((await up(undefined)).status, 401);
    assert.equal((await up(asAdmin('COUNTRY_ADMIN', oid()))).status, 403);
    // Cloudinary is not configured in the test environment → a clear 503 proves the role check passed.
    const saved = { ...env.cloudinary }; Object.assign(env.cloudinary, { cloudName: undefined, apiKey: undefined, apiSecret: undefined });
    try {
      assert.equal((await up(asAdmin('CONTENT_EDITOR'))).status, 503);
      assert.equal((await up(asAdmin('INTERNATIONAL_ADMIN'))).status, 503);
    } finally { Object.assign(env.cloudinary, saved); }
  });
});

describe('referenced records cannot be deleted from under the history', () => {
  const o = {};
  afterEach(() => { User.findById = origFindById; Object.assign(Person, { findById: o.pf }); Organization.countDocuments = o.oc; Ministry.countDocuments = o.mc; CountryAdministration.countDocuments = o.cc; AffiliatePastorsBoard.countDocuments = o.bc; HistoryEvent.countDocuments = o.hc; });
  test('a person featured in a history entry → 409', async () => {
    Object.assign(o, { pf: Person.findById, oc: Organization.countDocuments, mc: Ministry.countDocuments, cc: CountryAdministration.countDocuments, bc: AffiliatePastorsBoard.countDocuments, hc: HistoryEvent.countDocuments });
    const doc = { roles: [], select() { return doc; }, populate() { return doc; }, lean: async () => ({ _id: 'x', roles: [] }), deleteOne: async () => { throw new Error('must not delete'); } };
    Person.findById = () => doc;
    Organization.countDocuments = Ministry.countDocuments = CountryAdministration.countDocuments = AffiliatePastorsBoard.countDocuments = async () => 0;
    HistoryEvent.countDocuments = async () => 2;
    const r = await api('DELETE', `/api/admin/people/${oid()}`, { token: asAdmin('SUPER_ADMIN') });
    assert.equal(r.status, 409);
    assert.match(r.json.error, /2 history entries/);
  });
});

describe('supplied founder content integrity', () => {
  const byKey = Object.fromEntries(HISTORY_SEED.map((e) => [e.key, e]));
  const allText = HISTORY_SEED.map((e) => `${e.title} ${e.subtitle || ''} ${e.description || ''} ${e.dateLabel || ''} ${e.location || ''}`).join('\n');

  test('every entry is well-formed, uniquely keyed, attributed and flagged for confirmation', () => {
    assert.equal(new Set(HISTORY_SEED.map((e) => e.key)).size, HISTORY_SEED.length);
    for (const e of HISTORY_SEED) {
      assert.ok(HISTORY_SECTIONS.includes(e.section), e.key);
      assert.ok(e.title && e.source, e.key);
      assert.equal(e.reviewStatus, 'needs_confirmation', `${e.key} must stay flagged until the founder confirms`);
      assert.ok(e.reviewNote, e.key);
    }
  });
  test('every page section has content', () => {
    for (const s of HISTORY_SECTIONS) assert.ok(HISTORY_SEED.some((e) => e.section === s), s);
  });
  test('supplied details are preserved verbatim', () => {
    for (const must of [
      'February 26, 1897', 'Church of the Nazarene', 'approximately 200 books', '35-year', 'Heroine of Burma', '1947',
      'Bearl Darwin Smalldridge (1928–2016)', 'Bahamas and Liberia', 'over 50 churches', 'West and East Cameroon',
      'World Wide Missions Secondary School in Mupundu-Muyuka in 1969', 'more than five years',
      'returned to Cameroon in 2008', 'Director of World Wide Missions Cameroon',
      'Rev. Ebai Aloysius', 'Rev. Anang Christopher Fang', '36 years (1985–2021)', 'over 50 nations',
      'Uganda, Kenya, India and the Philippines',
      '1593 East Colorado Boulevard', 'P.O. Box G, Pasadena, CA 91109', 'P.O. Box 44, Muyuka, Southwest Region, Cameroon',
      'Officially authorized by Decree No. 71/DF/608 of 3 December 1971. Headquarters historically recorded at Muyuka, Cameroon.',
    ]) assert.ok(allText.includes(must), `missing: ${must}`);
  });
  test('Brazil is only a pending placeholder — no invented date, people or activities', () => {
    const b = byKey['brazil-pending'];
    assert.equal(b.entryType, 'pending');
    for (const f of ['year', 'dateLabel', 'people', 'location']) assert.equal(b[f], undefined, f);
    assert.ok(!/found(ed|ing)|since|led by|director|church|school/i.test(b.description));
  });
  test('addresses and the decree are records, are never described as current', () => {
    for (const k of ['record-pasadena', 'record-cameroon', 'record-decree']) {
      assert.equal(byKey[k].entryType, 'record');
      assert.ok(!/\bcurrent(ly)?\b/i.test(byKey[k].description), k);
    }
  });
  test('known discrepancies with docs/PROJECT_SPEC.md are recorded privately, not hidden', () => {
    assert.match(byKey['ebai-superintendent'].reviewNote, /Elias A\. Ebai/);
    assert.match(byKey['secondary-school'].reviewNote, /Mpundu-Muyuka/);
  });
  test('the public text states claims as the founder’s notes, never as verified fact', () => {
    assert.ok(!/\bverified\b|\bconfirmed\b/i.test(allText));
    for (const k of ['smalldridge-couple', 'churches-established', 'secondary-school', 'fred-johnson']) {
      assert.match(byKey[k].description, /notes|according to/i, k);
    }
  });
  test('leadership order follows the supplied succession only', () => {
    const order = HISTORY_SEED.filter((e) => e.section === 'cameroon-leadership').sort((a, b) => a.order - b.order).map((e) => e.key);
    assert.deepEqual(order, ['jonathan-smalldridge', 'ebai-superintendent', 'fang-superintendent']);
  });
});

describe('seed helper — linking people', () => {
  test('matches existing people by normalized name; reports unknown and ambiguous names', async () => {
    const a = oid(); const b = oid(); const c = oid();
    const norm = (s) => s.toLowerCase().replace(/\b(rev|dr|pastor|mr|mrs)\.?\s+/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const dir = new Map([[norm('Anang Christopher Fang'), [a]], [norm('Twin Name'), [b, c]]]);
    const r = await resolvePeople(['Rev. Anang Christopher Fang', 'Twin Name', 'Nobody Known'], dir);
    assert.deepEqual(r.ids, [a]);
    assert.equal(r.missing.length, 2);
    assert.match(r.missing[0], /ambiguous/);
  });
});

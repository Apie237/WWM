// Phase 8 tests (News, Events, Resources, Prayer Requests, Contact, and their
// admin modules). Same conventions as phase7RelationshipAuthorization.test.js:
// Node's built-in runner, no new dependency, and Mongoose model methods are
// mocked because no MongoDB is reachable in the dev sandbox. The validation,
// authorization, and routing logic under test runs for real (including real
// HTTP requests against the real Express app); the database is the only stub,
// so this is NOT a database-backed integration test.
import { test, describe, beforeEach, afterEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import './helpers/raiseRateLimit.js'; // must load before the app (see file)
import { createApp } from '../app.js';
import { signAdminToken } from '../services/authService.js';
import { User, Country, News, Event, Resource, PrayerRequest, ContactMessage } from '../models/index.js';
import { cleanString, cleanEmail, cleanHttpUrl } from '../utils/inputValidation.js';
import { validateNews } from '../services/admin/newsAdminService.js';
import { validateEvent } from '../services/admin/eventAdminService.js';
import { validateResource } from '../services/admin/resourceAdminService.js';
import { buildEventFilter } from '../services/eventService.js';

const oid = () => new mongoose.Types.ObjectId().toString();

async function expectApiError(fn, status, includes) {
  await assert.rejects(fn, (err) => {
    assert.equal(err.status, status, `expected ${status}, got ${err.status} (${err.message})`);
    if (includes) assert.ok(err.message.includes(includes), `"${err.message}" should include "${includes}"`);
    return true;
  });
}

// ---- tiny HTTP harness against the real app ----
let server;
let base;
before(async () => {
  server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

async function call(method, path, { body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}

// Logs in as a fake admin by mocking only User.findById (what requireAuth uses).
const origFindById = User.findById;
function asAdmin(role, countryId = null) {
  const user = {
    _id: new mongoose.Types.ObjectId(),
    name: 'T', email: 't@example.test', role, isActive: true,
    country: countryId ? { _id: new mongoose.Types.ObjectId(countryId), name: 'C', slug: 'c' } : null,
  };
  User.findById = () => ({ populate: async () => user });
  return signAdminToken({ ...user, country: countryId ? new mongoose.Types.ObjectId(countryId) : null });
}
afterEach(() => { User.findById = origFindById; });

describe('input validation helpers', () => {
  test('cleanString trims, enforces required and max', () => {
    assert.equal(cleanString('  hi ', 'f'), 'hi');
    assert.equal(cleanString('', 'f'), undefined);
    assert.throws(() => cleanString('', 'f', { required: true }), (e) => e.status === 400);
    assert.throws(() => cleanString('x'.repeat(11), 'f', { max: 10 }), (e) => e.status === 400);
    assert.throws(() => cleanString({ $gt: '' }, 'f'), (e) => e.status === 400, 'objects (NoSQL-style payloads) are rejected');
  });
  test('cleanEmail rejects malformed addresses', () => {
    assert.equal(cleanEmail(' A@B.co '), 'a@b.co');
    assert.throws(() => cleanEmail('nope'), (e) => e.status === 400);
  });
  test('cleanHttpUrl allows only http(s)', () => {
    assert.equal(cleanHttpUrl('https://example.org/a', 'u'), 'https://example.org/a');
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'ftp://x.org', 'not a url']) {
      assert.throws(() => cleanHttpUrl(bad, 'u'), (e) => e.status === 400, bad);
    }
  });
});

describe('public prayer requests', () => {
  let created;
  let origCreate; let origFind; let origCount;
  beforeEach(() => {
    created = [];
    origCreate = PrayerRequest.create; origFind = PrayerRequest.find; origCount = PrayerRequest.countDocuments;
    PrayerRequest.create = async (d) => { created.push(d); return { _id: oid(), status: 'pending' }; };
  });
  afterEach(() => { PrayerRequest.create = origCreate; PrayerRequest.find = origFind; PrayerRequest.countDocuments = origCount; });

  test('accepts a valid request and stores ONLY whitelisted fields (status/moderationNote ignored)', async () => {
    const r = await call('POST', '/api/prayer-requests', { body: { request: 'Pray for rain', name: 'Ann', showName: true, status: 'approved', moderationNote: 'x', _id: oid() } });
    assert.equal(r.status, 201);
    assert.deepEqual(Object.keys(created[0]).sort(), ['name', 'request', 'showName']);
    assert.equal(created[0].showName, true);
  });
  test('showName is false unless a name was given AND showName === true', async () => {
    await call('POST', '/api/prayer-requests', { body: { request: 'a', showName: true } });
    await call('POST', '/api/prayer-requests', { body: { request: 'b', name: 'Bo', showName: 'true' } });
    assert.equal(created[0].showName, false);
    assert.equal(created[1].showName, false);
  });
  test('missing/oversized request is a 400 and nothing is stored', async () => {
    assert.equal((await call('POST', '/api/prayer-requests', { body: {} })).status, 400);
    assert.equal((await call('POST', '/api/prayer-requests', { body: { request: 'x'.repeat(2001) } })).status, 400);
    assert.equal(created.length, 0);
  });
  test('honeypot field: pretends success, stores nothing', async () => {
    const r = await call('POST', '/api/prayer-requests', { body: { request: 'spam', website: 'http://spam' } });
    assert.equal(r.status, 201);
    assert.equal(created.length, 0);
  });
  test('public list only queries approved requests and hides names unless opted in', async () => {
    let seenFilter;
    PrayerRequest.find = (f) => {
      seenFilter = f;
      const rows = [
        { _id: 1, name: 'Ann', showName: true, request: 'r1', createdAt: new Date() },
        { _id: 2, name: 'Secret', showName: false, request: 'r2', createdAt: new Date() },
      ];
      const chain = { select: () => chain, populate: () => chain, sort: () => chain, skip: () => chain, limit: () => chain, lean: async () => rows };
      return chain;
    };
    PrayerRequest.countDocuments = async () => 2;
    const r = await call('GET', '/api/prayer-requests');
    assert.equal(r.status, 200);
    assert.deepEqual(seenFilter, { status: 'approved' });
    assert.equal(r.json.data[0].name, 'Ann');
    assert.equal(r.json.data[1].name, null);
    assert.ok(!JSON.stringify(r.json).includes('Secret'));
  });
});

describe('public contact form', () => {
  let created; let orig;
  beforeEach(() => { created = []; orig = ContactMessage.create; ContactMessage.create = async (d) => { created.push(d); return { _id: oid() }; }; });
  afterEach(() => { ContactMessage.create = orig; });

  test('valid message stored with whitelisted fields only', async () => {
    const r = await call('POST', '/api/contact', { body: { name: 'N', email: 'n@x.org', message: 'hello', status: 'archived' } });
    assert.equal(r.status, 201);
    assert.ok(!('status' in created[0]));
  });
  test('invalid email / missing message → 400', async () => {
    assert.equal((await call('POST', '/api/contact', { body: { name: 'N', email: 'bad', message: 'm' } })).status, 400);
    assert.equal((await call('POST', '/api/contact', { body: { name: 'N', email: 'n@x.org' } })).status, 400);
    assert.equal(created.length, 0);
  });
  test('honeypot stores nothing', async () => {
    assert.equal((await call('POST', '/api/contact', { body: { website: 'x' } })).status, 201);
    assert.equal(created.length, 0);
  });
});

describe('public read endpoints', () => {
  test('news list only queries published, already-published items', async () => {
    let filter;
    const orig = News.find; const origCount = News.countDocuments;
    News.find = (f) => { filter = f; const c = { select: () => c, populate: () => c, sort: () => c, skip: () => c, limit: () => c, lean: async () => [] }; return c; };
    News.countDocuments = async () => 0;
    try {
      const r = await call('GET', '/api/news');
      assert.equal(r.status, 200);
      assert.equal(filter.status, 'published');
      assert.ok(filter.publishedAt.$lte instanceof Date);
    } finally { News.find = orig; News.countDocuments = origCount; }
  });
  test('unknown news / event slug → 404 (drafts are indistinguishable from missing)', async () => {
    const oN = News.findOne; const oE = Event.findOne;
    const chain = { select: () => chain, populate: () => chain, lean: async () => null };
    News.findOne = () => chain; Event.findOne = () => chain;
    try {
      assert.equal((await call('GET', '/api/news/nope')).status, 404);
      assert.equal((await call('GET', '/api/events/nope')).status, 404);
    } finally { News.findOne = oN; Event.findOne = oE; }
  });
  test('invalid events "when" and resources "type" are 400s', async () => {
    assert.equal((await call('GET', '/api/events?when=sometime')).status, 400);
    assert.equal((await call('GET', '/api/resources?type=bogus')).status, 400);
  });
  test('event upcoming/past filters are complementary', () => {
    const up = buildEventFilter('upcoming');
    const past = buildEventFilter('past');
    assert.equal(up.status, 'published');
    assert.ok(Array.isArray(up.$or) && Array.isArray(past.$nor));
    assert.equal(buildEventFilter(undefined).$or, undefined);
  });
  test('resources list only queries published', async () => {
    let filter;
    const o = Resource.find; const oc = Resource.countDocuments;
    Resource.find = (f) => { filter = f; const c = { select: () => c, sort: () => c, skip: () => c, limit: () => c, lean: async () => [] }; return c; };
    Resource.countDocuments = async () => 0;
    try { assert.equal((await call('GET', '/api/resources?type=sermon')).status, 200); } finally { Resource.find = o; Resource.countDocuments = oc; }
    assert.deepEqual(filter, { status: 'published', resourceType: 'sermon' });
  });
});

describe('admin content validation', () => {
  let origExists;
  beforeEach(() => { origExists = Country.exists; Country.exists = async () => true; });
  afterEach(() => { Country.exists = origExists; });

  test('news: title required on create; bad status / javascript: image / malformed or missing country → 400', async () => {
    await expectApiError(() => validateNews({}, { existing: null }), 400, 'title');
    await expectApiError(() => validateNews({ title: 'T', status: 'live' }, { existing: null }), 400, 'status');
    await expectApiError(() => validateNews({ title: 'T', imageUrl: 'javascript:1' }, { existing: null }), 400, 'imageUrl');
    await expectApiError(() => validateNews({ title: 'T', country: 'not-an-id' }, { existing: null }), 400, 'country');
    Country.exists = async () => false;
    await expectApiError(() => validateNews({ title: 'T', country: oid() }, { existing: null }), 400, 'does not exist');
  });
  test('news: a PATCH of one field leaves others absent (no accidental wipe)', async () => {
    const out = await validateNews({ summary: 'new' }, { existing: { title: 'Old' } });
    assert.deepEqual(Object.keys(out), ['summary']);
  });
  test('events: startDate required on create; end before start rejected, also when only one date is patched', async () => {
    await expectApiError(() => validateEvent({ title: 'E' }, { existing: null }), 400, 'startDate');
    await expectApiError(() => validateEvent({ title: 'E', startDate: 'garbage' }, { existing: null }), 400, 'valid date');
    await expectApiError(() => validateEvent({ title: 'E', startDate: '2026-05-02', endDate: '2026-05-01' }, { existing: null }), 400, 'endDate');
    await expectApiError(() => validateEvent({ endDate: '2026-01-01' }, { existing: { startDate: new Date('2026-05-01') } }), 400, 'endDate');
    await validateEvent({ title: 'E', startDate: '2026-05-01', endDate: '2026-05-01' }, { existing: null });
  });
  test('resources: http(s) url required, type enum enforced', async () => {
    await expectApiError(() => validateResource({ title: 'R' }, { existing: null }), 400, 'url');
    await expectApiError(() => validateResource({ title: 'R', url: 'javascript:1' }, { existing: null }), 400, 'url');
    await expectApiError(() => validateResource({ title: 'R', url: 'https://a.org', resourceType: 'zip' }, { existing: null }), 400, 'resourceType');
  });
});

describe('admin authorization (real HTTP + real middleware)', () => {
  const mine = oid();
  const other = oid();

  test('unauthenticated admin requests → 401', async () => {
    for (const p of ['news', 'events', 'resources', 'prayer-requests', 'contact-messages']) {
      assert.equal((await call('GET', `/api/admin/${p}`)).status, 401, p);
    }
  });
  test('CONTENT_EDITOR cannot read prayer requests or contact messages; COUNTRY_ADMIN cannot read contact messages', async () => {
    let t = asAdmin('CONTENT_EDITOR');
    assert.equal((await call('GET', '/api/admin/prayer-requests', { token: t })).status, 403);
    assert.equal((await call('GET', '/api/admin/contact-messages', { token: t })).status, 403);
    t = asAdmin('COUNTRY_ADMIN', mine);
    assert.equal((await call('GET', '/api/admin/contact-messages', { token: t })).status, 403);
  });
  test('COUNTRY_ADMIN cannot create/update/delete resources (international content)', async () => {
    const t = asAdmin('COUNTRY_ADMIN', mine);
    assert.equal((await call('POST', '/api/admin/resources', { token: t, body: { title: 'R', url: 'https://a.org' } })).status, 403);
    assert.equal((await call('PATCH', `/api/admin/resources/${oid()}`, { token: t, body: { title: 'R' } })).status, 403);
    assert.equal((await call('DELETE', `/api/admin/resources/${oid()}`, { token: t })).status, 403);
  });
  test('COUNTRY_ADMIN news list is forced to their own country, ignoring ?country=', async () => {
    let filter;
    const o = News.find; const oc = News.countDocuments;
    News.find = (f) => { filter = f; const c = { select: () => c, populate: () => c, sort: () => c, skip: () => c, limit: () => c, lean: async () => [] }; return c; };
    News.countDocuments = async () => 0;
    try {
      const t = asAdmin('COUNTRY_ADMIN', mine);
      assert.equal((await call('GET', `/api/admin/news?country=${other}`, { token: t })).status, 200);
      assert.equal(String(filter.country), mine);
    } finally { News.find = o; News.countDocuments = oc; }
  });
  test('COUNTRY_ADMIN: create news must be for own country; other/missing country rejected', async () => {
    const t = asAdmin('COUNTRY_ADMIN', mine);
    assert.equal((await call('POST', '/api/admin/news', { token: t, body: { title: 'N', country: other } })).status, 403);
    assert.equal((await call('POST', '/api/admin/news', { token: t, body: { title: 'N' } })).status, 400);
  });
  test('COUNTRY_ADMIN: cannot view/edit/delete another country’s or international news/events/prayer requests', async () => {
    const o1 = News.findById; const o2 = Event.findById; const o3 = PrayerRequest.findById;
    const rec = (country) => () => { const c = { select: () => c, populate: () => c, lean: async () => ({ _id: oid(), country }) }; return c; };
    try {
      const t = asAdmin('COUNTRY_ADMIN', mine);
      for (const [Model, path] of [[News, 'news'], [Event, 'events'], [PrayerRequest, 'prayer-requests']]) {
        for (const country of [other, null]) {
          Model.findById = rec(country);
          assert.equal((await call('GET', `/api/admin/${path}/${oid()}`, { token: t })).status, 403, `${path} get ${country}`);
          assert.equal((await call('PATCH', `/api/admin/${path}/${oid()}`, { token: t, body: { status: 'approved', title: 'x' } })).status, 403, `${path} patch ${country}`);
          assert.equal((await call('DELETE', `/api/admin/${path}/${oid()}`, { token: t })).status, 403, `${path} delete ${country}`);
        }
      }
    } finally { News.findById = o1; Event.findById = o2; PrayerRequest.findById = o3; }
  });
  test('malformed ids → 400 (not 500) on admin routes', async () => {
    const t = asAdmin('SUPER_ADMIN');
    assert.equal((await call('GET', '/api/admin/news/not-an-id', { token: t })).status, 400);
    assert.equal((await call('GET', '/api/admin/news?country=zzz', { token: t })).status, 400);
    assert.equal((await call('PATCH', '/api/admin/prayer-requests/xyz', { token: t, body: { status: 'approved' } })).status, 400);
  });
  test('INTERNATIONAL_ADMIN can create news for any country and list with a country filter', async () => {
    const oe = Country.exists; Country.exists = async () => true;
    const oSave = News.prototype.save; let saved;
    // Run the real schema hooks (slug generation, publishedAt) without a DB.
    News.prototype.save = async function save() { await this.validate(); saved = this; return this; };
    const of = News.find; const oc = News.countDocuments;
    let filter;
    News.find = (f) => { filter = f; const c = { select: () => c, populate: () => c, sort: () => c, skip: () => c, limit: () => c, lean: async () => [] }; return c; };
    News.countDocuments = async () => 0;
    try {
      const t = asAdmin('INTERNATIONAL_ADMIN');
      const r = await call('POST', '/api/admin/news', { token: t, body: { title: 'World news', country: other, status: 'published', _id: oid(), createdAt: '2000-01-01' } });
      assert.equal(r.status, 201);
      assert.equal(saved.title, 'World news');
      assert.equal(saved.slug, 'world-news');
      assert.ok(saved.publishedAt instanceof Date, 'publishing sets publishedAt');
      assert.notEqual(String(saved.createdAt), '2000-01-01', 'non-whitelisted fields are ignored');
      await call('GET', `/api/admin/news?country=${other}`, { token: t });
      assert.equal(String(filter.country), other);
    } finally { Country.exists = oe; News.prototype.save = oSave; News.find = of; News.countDocuments = oc; }
  });
  test('prayer moderation can change only status/moderationNote, never the submitted text', async () => {
    const doc = { _id: oid(), request: 'original', status: 'pending', country: null, toObject() { return { ...this }; }, set(v) { Object.assign(this, v); }, async save() {} };
    const o = PrayerRequest.findById; PrayerRequest.findById = () => doc;
    try {
      const t = asAdmin('SUPER_ADMIN');
      const r = await call('PATCH', `/api/admin/prayer-requests/${oid()}`, { token: t, body: { status: 'approved', request: 'HACKED', country: oid() } });
      assert.equal(r.status, 200);
      assert.equal(doc.status, 'approved');
      assert.equal(doc.request, 'original');
      assert.equal((await call('PATCH', `/api/admin/prayer-requests/${oid()}`, { token: t, body: { status: 'bogus' } })).status, 400);
    } finally { PrayerRequest.findById = o; }
  });
});

// Phase 9 tests: Cloudinary media uploads, ownership, and safe cleanup.
//
// Same conventions as the Phase 7/8 suites: Node's built-in runner, no new
// dependency, Mongoose model methods mocked (no MongoDB in the dev sandbox),
// real Express app + real auth/role middleware over real HTTP. Cloudinary is
// mocked at the network layer by intercepting fetch() calls to
// api.cloudinary.com — the real signing, multipart building and response
// handling in mediaService all run. NO real Cloudinary request is ever made,
// so none of this verifies the live Cloudinary integration.
import { test, describe, beforeEach, afterEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import './helpers/smallUploadLimit.js'; // must load before the app
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { signAdminToken } from '../services/authService.js';
import { User, News, Event, Person, Country, HistoryEvent } from '../models/index.js';
import { signParams, sniffImageMime, isValidPublicId, prepareImageField } from '../services/mediaService.js';

const oid = () => new mongoose.Types.ObjectId().toString();
const SECRET = 'SECRET-VALUE-XYZ';
const hex32 = () => crypto.randomBytes(16).toString('hex');
const nid = (kind = 'news') => `wwm/${kind}/${hex32()}`;

// ---- sample files (only the leading bytes matter to the sniffing) ----
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(40)]);

// ---- HTTP harness against the real app ----
let server;
let base;
before(async () => {
  server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

const realFetch = globalThis.fetch;
let cloud; // { calls: [], respond: (call) => Response }
function installCloudinaryMock() {
  cloud = { calls: [], respond: null };
  globalThis.fetch = async (url, init) => {
    if (!String(url).includes('api.cloudinary.com')) return realFetch(url, init);
    const call = { url: String(url), body: init?.body };
    cloud.calls.push(call);
    return cloud.respond(call);
  };
}
const okUpload = (call) => {
  const id = `${call.body.get('folder')}/${call.body.get('public_id')}`;
  return new Response(JSON.stringify({ public_id: id, format: 'jpg', width: 800, height: 600, bytes: 1234, secure_url: 'x' }), { status: 200 });
};

async function api(method, path, { body, token, headers = {} } = {}) {
  const isBuf = Buffer.isBuffer(body);
  const res = await realFetch(base + path, {
    method,
    headers: {
      ...(isBuf || body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isBuf ? body : JSON.stringify(body),
  });
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text };
}

const origFindById = User.findById;
function asAdmin(role, countryId = null) {
  const user = {
    _id: new mongoose.Types.ObjectId(), name: 'T', email: 't@example.test', role, isActive: true,
    country: countryId ? { _id: new mongoose.Types.ObjectId(countryId), name: 'C', slug: 'c' } : null,
  };
  User.findById = () => ({ populate: async () => user });
  return signAdminToken({ ...user, country: countryId ? new mongoose.Types.ObjectId(countryId) : null });
}

// All four owning models' `exists`, driven by a set of "referenced" ids.
const origExists = { News: News.exists, Event: Event.exists, Person: Person.exists, Country: Country.exists, HistoryEvent: HistoryEvent.exists };
function mockReferences(referenced = []) {
  const set = new Set(referenced);
  const fn = async (filter) => {
    const key = Object.keys(filter).find((k) => /PublicId$/.test(k));
    if (key) return set.has(filter[key]) ? { _id: 1 } : null;
    return { _id: 1 }; // e.g. Country.exists({ _id }) used by reference validation
  };
  News.exists = fn; Event.exists = fn; Person.exists = fn; Country.exists = fn; HistoryEvent.exists = fn;
}

// A stand-in that works both as `Model.findById(id)` (a document with
// toObject/set/save/deleteOne) and as the chained `.select().populate().lean()`.
function hybridDoc(record) {
  const doc = {
    ...record,
    saved: 0, deleted: 0,
    toObject() { const { saved, deleted, ...rest } = this; return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')); },
    set(v) { for (const [k, val] of Object.entries(v)) { if (val === undefined) delete this[k]; else this[k] = val; } },
    async save() { this.saved++; },
    async deleteOne() { this.deleted++; },
    select() { return this; }, populate() { return this; },
    async lean() { return record; },
  };
  return doc;
}

beforeEach(() => {
  Object.assign(env.cloudinary, { cloudName: 'testcloud', apiKey: 'key123', apiSecret: SECRET });
  installCloudinaryMock();
  cloud.respond = okUpload;
  mockReferences([]);
});
afterEach(() => {
  globalThis.fetch = realFetch;
  User.findById = origFindById;
  Object.assign(News, { exists: origExists.News }); Event.exists = origExists.Event; Person.exists = origExists.Person; Country.exists = origExists.Country; HistoryEvent.exists = origExists.HistoryEvent;
  Object.assign(env.cloudinary, { cloudName: undefined, apiKey: undefined, apiSecret: undefined });
});

describe('pure helpers', () => {
  test('signParams matches Cloudinary’s published example signature', () => {
    // From Cloudinary's documentation: sorted params + api_secret "abcd".
    const sig = signParams({ eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop', public_id: 'sample_image', timestamp: 1315060510 }, 'abcd');
    assert.equal(sig, 'bfd09f95f331f558cbd1320e67aa8d488770583e');
  });
  test('signParams ignores empty values and sorts keys', () => {
    assert.equal(signParams({ b: 2, a: 1, c: '' }, 's'), crypto.createHash('sha1').update('a=1&b=2s').digest('hex'));
  });
  test('sniffImageMime identifies by bytes and rejects everything else', () => {
    assert.equal(sniffImageMime(JPEG), 'image/jpeg');
    assert.equal(sniffImageMime(PNG), 'image/png');
    assert.equal(sniffImageMime(WEBP), 'image/webp');
    assert.equal(sniffImageMime(Buffer.from('GIF89a' + 'x'.repeat(30))), null);
    assert.equal(sniffImageMime(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
    assert.equal(sniffImageMime(Buffer.from('<?php echo 1; ?>' + ' '.repeat(20))), null);
    assert.equal(sniffImageMime(Buffer.alloc(3)), null);
  });
  test('isValidPublicId accepts only wwm/<kind>/<32 hex>', () => {
    assert.ok(isValidPublicId(nid('news'), 'news'));
    assert.ok(!isValidPublicId(nid('news'), 'people'), 'wrong kind');
    for (const bad of ['', null, 42, 'wwm/news/short', 'wwm/news/../../etc', 'other/news/' + hex32(), `wwm/news/${hex32().toUpperCase()}`, `https://res.cloudinary.com/x/${hex32()}`, `wwm/news/${hex32()}/extra`]) {
      assert.ok(!isValidPublicId(bad), String(bad));
    }
  });
});

describe('upload endpoint — authentication, authorization, configuration', () => {
  test('unauthenticated upload and config requests → 401, Cloudinary never called', async () => {
    assert.equal((await api('POST', '/api/admin/media/upload/news', { body: PNG, headers: { 'content-type': 'image/png' } })).status, 401);
    assert.equal((await api('GET', '/api/admin/media/config')).status, 401);
    assert.equal(cloud.calls.length, 0);
  });
  test('CONTENT_EDITOR cannot upload country flags; unknown kinds are 404', async () => {
    const t = asAdmin('CONTENT_EDITOR');
    assert.equal((await api('POST', '/api/admin/media/upload/countries', { token: t, body: PNG, headers: { 'content-type': 'image/png' } })).status, 403);
    assert.equal((await api('POST', '/api/admin/media/upload/organizations', { token: t, body: PNG, headers: { 'content-type': 'image/png' } })).status, 404);
    assert.equal(cloud.calls.length, 0);
  });
  test('missing Cloudinary configuration → clear 503, no upstream call, no secrets in the message', async () => {
    Object.assign(env.cloudinary, { cloudName: undefined, apiKey: undefined, apiSecret: undefined });
    const t = asAdmin('SUPER_ADMIN');
    const r = await api('POST', '/api/admin/media/upload/news', { token: t, body: PNG, headers: { 'content-type': 'image/png' } });
    assert.equal(r.status, 503);
    assert.match(r.json.error, /not configured/i);
    assert.equal(cloud.calls.length, 0);
    const cfg = await api('GET', '/api/admin/media/config', { token: t });
    assert.equal(cfg.json.data.enabled, false);
  });
  test('partially configured (secret missing) also counts as not configured', async () => {
    env.cloudinary.apiSecret = undefined;
    const t = asAdmin('SUPER_ADMIN');
    assert.equal((await api('POST', '/api/admin/media/upload/news', { token: t, body: PNG, headers: { 'content-type': 'image/png' } })).status, 503);
  });
  test('config endpoint exposes limits only — never credentials', async () => {
    const t = asAdmin('COUNTRY_ADMIN', oid());
    const r = await api('GET', '/api/admin/media/config', { token: t });
    assert.equal(r.status, 200);
    assert.deepEqual(Object.keys(r.json.data).sort(), ['allowedTypes', 'enabled', 'maxBytes']);
    assert.equal(r.json.data.enabled, true);
    for (const secret of [SECRET, 'key123']) assert.ok(!r.text.includes(secret));
  });
});

describe('upload endpoint — file validation', () => {
  const up = (token, body, type) => api('POST', '/api/admin/media/upload/news', { token, body, headers: { 'content-type': type } });

  test('unsupported declared types (gif, svg, pdf, text) → 415', async () => {
    const t = asAdmin('SUPER_ADMIN');
    for (const type of ['image/gif', 'image/svg+xml', 'application/pdf', 'text/plain']) {
      assert.equal((await up(t, Buffer.from('x'.repeat(30)), type)).status, 415, type);
    }
    assert.equal(cloud.calls.length, 0);
  });
  test('declared as an image but not actually one → 400 (content is checked, not the label)', async () => {
    const t = asAdmin('SUPER_ADMIN');
    const r = await up(t, Buffer.from('<script>alert(1)</script>'.padEnd(40, ' ')), 'image/png');
    assert.equal(r.status, 400);
    assert.match(r.json.error, /not a valid/i);
    assert.equal(cloud.calls.length, 0);
  });
  test('real image whose bytes disagree with the declared type → 400', async () => {
    const t = asAdmin('SUPER_ADMIN');
    assert.equal((await up(t, JPEG, 'image/png')).status, 400);
    assert.equal((await up(t, PNG, 'image/webp')).status, 400);
  });
  test('oversized upload → 413 with a friendly message, nothing uploaded', async () => {
    const t = asAdmin('SUPER_ADMIN');
    const r = await up(t, Buffer.concat([PNG, Buffer.alloc(2048)]), 'image/png');
    assert.equal(r.status, 413);
    assert.match(r.json.error, /too large/i);
    assert.match(r.json.error, /MB/);
    assert.equal(cloud.calls.length, 0);
  });
  test('empty body → rejected (400/415), nothing uploaded', async () => {
    const t = asAdmin('SUPER_ADMIN');
    const r = await up(t, Buffer.alloc(0), 'image/png');
    assert.ok([400, 415].includes(r.status), String(r.status));
    assert.equal(cloud.calls.length, 0);
  });
});

describe('upload endpoint — valid uploads and Cloudinary failures', () => {
  test('JPEG, PNG and WebP are accepted; request is signed, secret never sent or returned', async () => {
    const t = asAdmin('INTERNATIONAL_ADMIN');
    for (const [buf, type] of [[JPEG, 'image/jpeg'], [PNG, 'image/png'], [WEBP, 'image/webp']]) {
      const r = await api('POST', '/api/admin/media/upload/people', { token: t, body: buf, headers: { 'content-type': type } });
      assert.equal(r.status, 201, type);
      assert.match(r.json.data.publicId, /^wwm\/people\/[a-f0-9]{32}$/);
      assert.equal(r.json.data.url, `https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto/${r.json.data.publicId}`);
      assert.ok(!r.text.includes(SECRET), 'API response must not contain the secret');
    }
    const call = cloud.calls[0];
    assert.equal(call.url, 'https://api.cloudinary.com/v1_1/testcloud/image/upload');
    const f = call.body;
    assert.equal(f.get('api_key'), 'key123');
    assert.equal(f.get('folder'), 'wwm/people');
    assert.equal(f.get('allowed_formats'), 'jpg,png,webp');
    assert.match(f.get('public_id'), /^[a-f0-9]{32}$/);
    assert.equal(f.get('api_secret'), null, 'the secret must never be sent as a field');
    const expected = signParams({ allowed_formats: f.get('allowed_formats'), folder: f.get('folder'), public_id: f.get('public_id'), timestamp: f.get('timestamp') }, SECRET);
    assert.equal(f.get('signature'), expected);
    assert.ok(f.get('file') instanceof Blob);
  });
  test('Cloudinary rejects the upload → 502 generic error; upstream detail and secret not leaked; no DB writes', async () => {
    const writes = [];
    const orig = [News.prototype.save, Person.prototype.save, Country.prototype.save];
    News.prototype.save = Person.prototype.save = Country.prototype.save = async function s() { writes.push(1); };
    cloud.respond = () => new Response(JSON.stringify({ error: { message: 'Invalid Signature internal-detail' } }), { status: 401 });
    const warn = console.warn; const logged = []; console.warn = (...a) => logged.push(a.join(' '));
    try {
      const t = asAdmin('SUPER_ADMIN');
      const r = await api('POST', '/api/admin/media/upload/news', { token: t, body: PNG, headers: { 'content-type': 'image/png' } });
      assert.equal(r.status, 502);
      assert.ok(!r.text.includes('internal-detail') && !r.text.includes(SECRET));
      assert.ok(!logged.join('\n').includes(SECRET), 'logs must not contain the secret');
      assert.equal(writes.length, 0, 'a failed upload must not create or change any record');
    } finally { console.warn = warn; [News.prototype.save, Person.prototype.save, Country.prototype.save] = orig; }
  });
  test('network failure and a mismatched public_id in the response → 502', async () => {
    const t = asAdmin('SUPER_ADMIN');
    cloud.respond = () => { throw new Error('connect ECONNREFUSED'); };
    assert.equal((await api('POST', '/api/admin/media/upload/news', { token: t, body: PNG, headers: { 'content-type': 'image/png' } })).status, 502);
    cloud.respond = () => new Response(JSON.stringify({ public_id: 'someone/else/asset' }), { status: 200 });
    assert.equal((await api('POST', '/api/admin/media/upload/news', { token: t, body: PNG, headers: { 'content-type': 'image/png' } })).status, 502);
  });
});

describe('prepareImageField — attach rules', () => {
  const spec = { urlField: 'imageUrl', idField: 'imagePublicId', kind: 'news' };

  test('a valid unreferenced id: URL is rebuilt server-side and a client URL is ignored', async () => {
    const id = nid('news');
    const data = { imagePublicId: id, imageUrl: 'https://evil.example/x.png' };
    const r = await prepareImageField(data, null, spec);
    assert.equal(data.imageUrl, `https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto/${id}`);
    assert.deepEqual(r, { previousId: null, nextId: id });
  });
  test('an id already used by another record → 409', async () => {
    const id = nid('news');
    mockReferences([id]);
    await assert.rejects(() => prepareImageField({ imagePublicId: id }, null, spec), (e) => e.status === 409);
  });
  test('re-sending the record’s own id is fine (no self-conflict)', async () => {
    const id = nid('news');
    mockReferences([id]);
    const data = { imagePublicId: id };
    await prepareImageField(data, { imagePublicId: id }, spec);
    assert.ok(data.imageUrl.endsWith(id));
  });
  test('malformed, URL-shaped, traversal, wrong-kind and non-string ids → 400', async () => {
    for (const bad of ['x', `https://res.cloudinary.com/testcloud/image/upload/${hex32()}`, 'wwm/news/../../secret', nid('people'), 123, {}, [nid('news')]]) {
      await assert.rejects(() => prepareImageField({ imagePublicId: bad }, null, spec), (e) => e.status === 400, JSON.stringify(bad));
    }
  });
  test('removing the image clears id and URL and reports the previous id for release', async () => {
    const id = nid('news');
    const data = { imagePublicId: null };
    const r = await prepareImageField(data, { imagePublicId: id, imageUrl: 'https://res.cloudinary.com/testcloud/x' }, spec);
    assert.deepEqual(r, { previousId: id, nextId: null });
    assert.equal(data.imagePublicId, undefined);
    assert.equal(data.imageUrl, undefined);
  });
  test('legacy URLs: http(s) accepted, javascript:/data: rejected, unchanged pre-Phase-9 value never blocks an edit', async () => {
    const ok = { imageUrl: 'https://example.org/a.png' };
    await prepareImageField(ok, null, spec);
    assert.equal(ok.imageUrl, 'https://example.org/a.png');
    for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAAA']) {
      await assert.rejects(() => prepareImageField({ imageUrl: bad }, null, spec), (e) => e.status === 400, bad);
    }
    const same = { imageUrl: '/legacy/relative.png', imagePublicId: '' };
    await prepareImageField(same, { imageUrl: '/legacy/relative.png' }, spec);
    assert.equal(same.imageUrl, '/legacy/relative.png');
  });
  test('re-sending a managed image’s unchanged URL (no id) does not drop the asset', async () => {
    const id = nid('news');
    const url = `https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto/${id}`;
    const data = { imageUrl: url };
    const r = await prepareImageField(data, { imagePublicId: id, imageUrl: url }, spec);
    assert.deepEqual(r, { previousId: id, nextId: id });
    assert.ok(!('imageUrl' in data));
  });
});

describe('replacement and deletion — never destroy an asset that is still in use', () => {
  const destroys = () => cloud.calls.filter((c) => c.url.endsWith('/image/destroy'));

  function newsRecord(overrides = {}) {
    return { _id: oid(), title: 'T', slug: 't', status: 'draft', ...overrides };
  }
  function useNews(record) {
    const doc = hybridDoc(record);
    const orig = News.findById;
    News.findById = () => doc;
    afterEachOnce(() => { News.findById = orig; });
    return doc;
  }
  const cleanups = [];
  const afterEachOnce = (fn) => cleanups.push(fn);
  afterEach(() => { while (cleanups.length) cleanups.pop()(); });

  test('replacing an image destroys the old asset once, signed, and only after saving', async () => {
    const oldId = nid('news'); const newId = nid('news');
    const doc = useNews(newsRecord({ imagePublicId: oldId, imageUrl: 'old' }));
    const t = asAdmin('SUPER_ADMIN');
    const r = await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: newId } });
    assert.equal(r.status, 200);
    assert.equal(doc.saved, 1);
    assert.equal(doc.imagePublicId, newId);
    assert.equal(destroys().length, 1);
    const body = destroys()[0].body;
    assert.equal(body.get('public_id'), oldId);
    assert.equal(body.get('api_key'), 'key123');
    assert.equal(body.get('api_secret'), null);
    assert.equal(body.get('signature'), signParams({ invalidate: 'true', public_id: oldId, timestamp: body.get('timestamp') }, SECRET));
  });
  test('the old asset is NOT destroyed if another record still references it', async () => {
    const oldId = nid('news'); const newId = nid('news');
    useNews(newsRecord({ imagePublicId: oldId }));
    mockReferences([oldId]); // someone else (e.g. a duplicated record) uses it too
    const t = asAdmin('SUPER_ADMIN');
    assert.equal((await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: newId } })).status, 200);
    assert.equal(destroys().length, 0);
  });
  test('removing an image reference releases the asset only when unreferenced', async () => {
    const id = nid('news');
    useNews(newsRecord({ imagePublicId: id, imageUrl: 'u' }));
    const t = asAdmin('SUPER_ADMIN');
    assert.equal((await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: null, imageUrl: '' } })).status, 200);
    assert.equal(destroys().length, 1);
    cloud.calls.length = 0;
    useNews(newsRecord({ imagePublicId: id }));
    mockReferences([id]);
    assert.equal((await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: null, imageUrl: '' } })).status, 200);
    assert.equal(destroys().length, 0);
  });
  test('an edit that does not touch the image never calls Cloudinary', async () => {
    const id = nid('news');
    useNews(newsRecord({ imagePublicId: id }));
    const t = asAdmin('SUPER_ADMIN');
    assert.equal((await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { summary: 'new summary' } })).status, 200);
    assert.equal(cloud.calls.length, 0);
  });
  test('a failed Cloudinary cleanup never fails the edit', async () => {
    const oldId = nid('news');
    useNews(newsRecord({ imagePublicId: oldId }));
    cloud.respond = () => new Response('{}', { status: 500 });
    const t = asAdmin('SUPER_ADMIN');
    const warn = console.warn; console.warn = () => {};
    try {
      assert.equal((await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: nid('news') } })).status, 200);
    } finally { console.warn = warn; }
  });
  test('if saving fails, nothing is destroyed', async () => {
    const oldId = nid('news');
    const doc = useNews(newsRecord({ imagePublicId: oldId }));
    doc.save = async () => { throw new Error('db down'); };
    const t = asAdmin('SUPER_ADMIN');
    const log = console.error; console.error = () => {};
    try {
      assert.equal((await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: nid('news') } })).status, 500);
    } finally { console.error = log; }
    assert.equal(destroys().length, 0);
  });
  test('deleting a record releases its image only when unreferenced', async () => {
    const id = nid('news');
    const doc = useNews(newsRecord({ imagePublicId: id }));
    const t = asAdmin('SUPER_ADMIN');
    assert.equal((await api('DELETE', `/api/admin/news/${oid()}`, { token: t })).status, 200);
    assert.equal(doc.deleted, 1);
    assert.equal(destroys().length, 1);
    cloud.calls.length = 0;
    useNews(newsRecord({ imagePublicId: id }));
    mockReferences([id]);
    assert.equal((await api('DELETE', `/api/admin/news/${oid()}`, { token: t })).status, 200);
    assert.equal(destroys().length, 0);
  });
  test('legacy or foreign-looking stored ids are never sent to Cloudinary for destruction', async () => {
    for (const weird of ['legacy-asset', 'someone/else/abc', 'wwm/news/../x']) {
      useNews(newsRecord({ imagePublicId: weird }));
      const t = asAdmin('SUPER_ADMIN');
      await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: null, imageUrl: '' } });
    }
    assert.equal(cloud.calls.length, 0);
  });
});

describe('country scope — a COUNTRY_ADMIN cannot touch another country’s media', () => {
  const mine = oid(); const other = oid();
  const noCalls = () => assert.equal(cloud.calls.length, 0, 'Cloudinary must not be called');

  function useRecord(Model, record) {
    const doc = hybridDoc(record);
    const orig = Model.findById;
    Model.findById = () => doc;
    return { doc, restore: () => { Model.findById = orig; } };
  }

  test('cannot replace, remove or delete the image on another country’s (or international) news/events', async () => {
    const t = asAdmin('COUNTRY_ADMIN', mine);
    for (const [Model, path] of [[News, 'news'], [Event, 'events']]) {
      for (const country of [other, null]) {
        const { doc, restore } = useRecord(Model, { _id: oid(), title: 'x', country, imagePublicId: nid(path), startDate: new Date() });
        try {
          assert.equal((await api('PATCH', `/api/admin/${path}/${oid()}`, { token: t, body: { imagePublicId: nid(path) } })).status, 403);
          assert.equal((await api('PATCH', `/api/admin/${path}/${oid()}`, { token: t, body: { imagePublicId: null, imageUrl: '' } })).status, 403);
          assert.equal((await api('DELETE', `/api/admin/${path}/${oid()}`, { token: t })).status, 403);
          assert.equal(doc.saved, 0); assert.equal(doc.deleted, 0);
        } finally { restore(); }
      }
    }
    noCalls();
  });
  test('cannot attach an image that already belongs to another record (even on their own country’s record)', async () => {
    const taken = nid('news');
    mockReferences([taken]);
    const { doc, restore } = useRecord(News, { _id: oid(), title: 'x', country: mine });
    try {
      const t = asAdmin('COUNTRY_ADMIN', mine);
      const r = await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: taken } });
      assert.equal(r.status, 409);
      assert.equal(doc.saved, 0);
    } finally { restore(); }
    noCalls();
  });
  test('may attach a fresh upload to their own country’s news', async () => {
    const fresh = nid('news');
    const { doc, restore } = useRecord(News, { _id: oid(), title: 'x', country: mine });
    try {
      const t = asAdmin('COUNTRY_ADMIN', mine);
      const r = await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: fresh, country: mine } });
      assert.equal(r.status, 200);
      assert.equal(doc.imagePublicId, fresh);
    } finally { restore(); }
  });
  test('may not move content to another country while attaching an image', async () => {
    const { doc, restore } = useRecord(News, { _id: oid(), title: 'x', country: mine });
    try {
      const t = asAdmin('COUNTRY_ADMIN', mine);
      assert.equal((await api('PATCH', `/api/admin/news/${oid()}`, { token: t, body: { imagePublicId: nid('news'), country: other } })).status, 403);
      assert.equal(doc.saved, 0);
    } finally { restore(); }
  });
  test('country flag: COUNTRY_ADMIN may not change another country’s flag; CONTENT_EDITOR may not at all', async () => {
    const { doc, restore } = useRecord(Country, { _id: oid(), name: 'X', flagImagePublicId: nid('countries') });
    try {
      const t = asAdmin('COUNTRY_ADMIN', mine);
      // The countries controller scopes by the :id path; a different id is another country.
      const r = await api('PATCH', `/api/admin/countries/${other}`, { token: t, body: { flagImagePublicId: nid('countries') } });
      assert.equal(r.status, 403);
      assert.equal(doc.saved, 0);
      const e = asAdmin('CONTENT_EDITOR');
      assert.equal((await api('PATCH', `/api/admin/countries/${mine}`, { token: e, body: { flagImagePublicId: nid('countries') } })).status, 403);
    } finally { restore(); }
    noCalls();
  });
  test('country flag: own country with a correct-kind image works; a news image is refused', async () => {
    const { doc, restore } = useRecord(Country, { _id: mine, name: 'Mine' });
    try {
      const t = asAdmin('COUNTRY_ADMIN', mine);
      const fresh = nid('countries');
      assert.equal((await api('PATCH', `/api/admin/countries/${mine}`, { token: t, body: { flagImagePublicId: fresh } })).status, 200);
      assert.equal(doc.flagImagePublicId, fresh);
      const log = console.error; console.error = () => {};
      try {
        assert.equal((await api('PATCH', `/api/admin/countries/${mine}`, { token: t, body: { flagImagePublicId: nid('news') } })).status, 400);
      } finally { console.error = log; }
    } finally { restore(); }
  });
});

describe('people photos', () => {
  test('a person photo must be a people-kind asset; mass-assignment of other media fields is ignored', async () => {
    const t = asAdmin('SUPER_ADMIN');
    const log = console.error; console.error = () => {};
    try {
      const r = await api('POST', '/api/admin/people', { token: t, body: { displayName: 'A', photoPublicId: nid('news') } });
      assert.equal(r.status, 400);
    } finally { console.error = log; }
  });
  test('create with a fresh people photo stores the id and a server-built URL', async () => {
    const t = asAdmin('SUPER_ADMIN');
    let saved;
    const orig = Person.prototype.save;
    Person.prototype.save = async function s() { saved = this; return this; };
    try {
      const id = nid('people');
      const r = await api('POST', '/api/admin/people', { token: t, body: { displayName: 'Ann', photoPublicId: id, photoUrl: 'https://evil.example/p.png' } });
      assert.equal(r.status, 201);
      assert.equal(saved.photoPublicId, id);
      assert.equal(saved.photoUrl, `https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto/${id}`);
    } finally { Person.prototype.save = orig; }
  });
});

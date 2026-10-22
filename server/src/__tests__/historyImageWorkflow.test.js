// History photograph workflow, end to end at the API level:
//   admin media config → authenticated upload (jpeg/png/webp) → create/edit a
//   History entry with the returned id → what is stored → what the PUBLIC API
//   returns. Same conventions as phase9Media.test.js: real Express app over
//   real HTTP, Mongoose model methods mocked, Cloudinary intercepted at fetch.
// NO real Cloudinary request is made, so this does not verify the live service.
import { test, describe, beforeEach, afterEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import './helpers/smallUploadLimit.js';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { signAdminToken } from '../services/authService.js';
import { User, News, Event, Person, Country, HistoryEvent } from '../models/index.js';

const SECRET = 'SECRET-VALUE-XYZ';
const KEY = 'key123';
const oid = () => new mongoose.Types.ObjectId().toString();
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(40)]);

let server; let base;
before(async () => {
  server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

const realFetch = globalThis.fetch;
function mockCloudinary() {
  globalThis.fetch = async (url, init) => {
    if (!String(url).includes('api.cloudinary.com')) return realFetch(url, init);
    const id = `${init.body.get('folder')}/${init.body.get('public_id')}`;
    return new Response(JSON.stringify({ public_id: id, format: 'jpg', width: 800, height: 600, bytes: 99 }), { status: 200 });
  };
}
async function api(method, path, { body, token, headers = {} } = {}) {
  const isBuf = Buffer.isBuffer(body);
  const res = await realFetch(base + path, {
    method,
    headers: { ...(isBuf || body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : isBuf ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text };
}
const origFindById = User.findById;
function asAdmin(role) {
  const user = { _id: new mongoose.Types.ObjectId(), name: 'T', email: 't@example.test', role, isActive: true, country: null };
  User.findById = () => ({ populate: async () => user });
  return signAdminToken({ ...user });
}
const upload = (token, buf, type) => api('POST', '/api/admin/media/upload/history', { token, body: buf, headers: { 'content-type': type } });

const origExists = { News: News.exists, Event: Event.exists, Person: Person.exists, Country: Country.exists, HistoryEvent: HistoryEvent.exists };
const orig = { save: HistoryEvent.prototype.save, findById: HistoryEvent.findById, find: HistoryEvent.find, count: HistoryEvent.countDocuments };
beforeEach(() => {
  Object.assign(env.cloudinary, { cloudName: 'testcloud', apiKey: KEY, apiSecret: SECRET });
  mockCloudinary();
  const none = async () => null; // no asset is referenced by any record
  News.exists = none; Event.exists = none; Person.exists = none; Country.exists = none; HistoryEvent.exists = none;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  User.findById = origFindById;
  Object.assign(News, { exists: origExists.News }); Event.exists = origExists.Event; Person.exists = origExists.Person; Country.exists = origExists.Country; HistoryEvent.exists = origExists.HistoryEvent;
  HistoryEvent.prototype.save = orig.save; HistoryEvent.findById = orig.findById; HistoryEvent.find = orig.find; HistoryEvent.countDocuments = orig.count;
  Object.assign(env.cloudinary, { cloudName: undefined, apiKey: undefined, apiSecret: undefined });
});

describe('media configuration the History form relies on', () => {
  test('reports enabled + limits when configured, and never contains a credential', async () => {
    const r = await api('GET', '/api/admin/media/config', { token: asAdmin('CONTENT_EDITOR') });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.enabled, true);
    assert.ok(r.json.data.maxBytes > 0);
    assert.deepEqual(r.json.data.allowedTypes, ['image/jpeg', 'image/png', 'image/webp']);
    assert.ok(!r.text.includes(SECRET) && !r.text.includes(KEY));
  });
  test('reports enabled:false (not an error) when Cloudinary is not configured, so the form can explain it', async () => {
    Object.assign(env.cloudinary, { cloudName: undefined, apiKey: undefined, apiSecret: undefined });
    const t = asAdmin('CONTENT_EDITOR');
    const r = await api('GET', '/api/admin/media/config', { token: t });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.enabled, false);
    const up = await upload(t, PNG, 'image/png');
    assert.equal(up.status, 503);
    assert.match(up.json.error, /not configured/i);
  });
  test('config requires a signed-in admin', async () => {
    assert.equal((await api('GET', '/api/admin/media/config')).status, 401);
  });
});

describe('upload → save → persisted fields', () => {
  for (const [name, buf, type] of [['JPEG', JPEG, 'image/jpeg'], ['PNG', PNG, 'image/png'], ['WebP', WEBP, 'image/webp']]) {
    test(`${name} is accepted by the history endpoint and returns a history-kind id and a server-built URL`, async () => {
      const r = await upload(asAdmin('CONTENT_EDITOR'), buf, type);
      assert.equal(r.status, 201, r.text);
      assert.match(r.json.data.publicId, /^wwm\/history\/[a-f0-9]{32}$/);
      assert.ok(r.json.data.url.startsWith(`https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto/${r.json.data.publicId}`));
      assert.ok(!r.text.includes(SECRET) && !r.text.includes(KEY));
    });
  }

  test('creating an entry with the uploaded id stores id + server-built URL + alt + caption (a forged URL is ignored)', async () => {
    const t = asAdmin('CONTENT_EDITOR');
    const up = (await upload(t, JPEG, 'image/jpeg')).json.data;
    let saved;
    HistoryEvent.prototype.save = async function s() { saved = this; return this; };
    const r = await api('POST', '/api/admin/history', {
      token: t,
      body: { title: 'T', section: 'origins', imageUrl: 'https://evil.example/x.png', imagePublicId: up.publicId, imageAlt: 'A couple', imageCaption: 'Caption text' },
    });
    assert.equal(r.status, 201, r.text);
    assert.equal(saved.imagePublicId, up.publicId);
    assert.equal(saved.imageUrl, up.url);
    assert.equal(saved.imageAlt, 'A couple');
    assert.equal(saved.imageCaption, 'Caption text');
  });

  function existingDoc(fields) {
    const doc = {
      ...fields, saves: 0,
      toObject() { const { saves, ...rest } = this; return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')); },
      set(v) { for (const [k, val] of Object.entries(v)) { if (val === undefined) delete this[k]; else this[k] = val; } },
      async save() { this.saves++; },
    };
    HistoryEvent.findById = async () => doc;
    return doc;
  }

  test('editing replaces the image and keeps alt/caption; removing clears id and URL together', async () => {
    const t = asAdmin('CONTENT_EDITOR');
    const oldId = `wwm/history/${crypto.randomBytes(16).toString('hex')}`;
    const doc = existingDoc({
      _id: oid(), title: 'T', section: 'origins', status: 'published',
      imagePublicId: oldId, imageUrl: `https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto/${oldId}`, imageAlt: 'old alt', imageCaption: 'old caption',
    });
    const up = (await upload(t, PNG, 'image/png')).json.data;
    let r = await api('PATCH', `/api/admin/history/${doc._id}`, { token: t, body: { imagePublicId: up.publicId, imageUrl: up.url, imageAlt: 'new alt', imageCaption: 'new caption' } });
    assert.equal(r.status, 200, r.text);
    assert.equal(doc.imagePublicId, up.publicId);
    assert.equal(doc.imageUrl, up.url);
    assert.equal(doc.imageAlt, 'new alt');
    assert.equal(doc.imageCaption, 'new caption');

    // The form's "Remove photograph" sends an empty URL and a null id.
    r = await api('PATCH', `/api/admin/history/${doc._id}`, { token: t, body: { imagePublicId: null, imageUrl: '' } });
    assert.equal(r.status, 200, r.text);
    assert.equal(doc.imagePublicId, undefined);
    assert.equal(doc.imageUrl, undefined);
  });

  test('saving the form WITHOUT touching the photo (same id + url) leaves the image as it was', async () => {
    const t = asAdmin('CONTENT_EDITOR');
    const id = `wwm/history/${crypto.randomBytes(16).toString('hex')}`;
    const url = `https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto/${id}`;
    const doc = existingDoc({ _id: oid(), title: 'T', section: 'origins', imagePublicId: id, imageUrl: url });
    const r = await api('PATCH', `/api/admin/history/${doc._id}`, { token: t, body: { title: 'T2', imagePublicId: id, imageUrl: url, imageAlt: 'alt' } });
    assert.equal(r.status, 200, r.text);
    assert.equal(doc.imagePublicId, id);
    assert.equal(doc.imageUrl, url);
    assert.equal(doc.title, 'T2');
  });

  test('a read-only role (COUNTRY_ADMIN) can neither upload nor save a History image', async () => {
    const t = asAdmin('COUNTRY_ADMIN');
    assert.equal((await upload(t, JPEG, 'image/jpeg')).status, 403);
    assert.equal((await api('POST', '/api/admin/history', { token: t, body: { title: 'T', section: 'origins' } })).status, 403);
  });
});

describe('public API returns what the page needs and nothing private', () => {
  // Emulates Mongoose's exclusion projection so the test fails if the service
  // ever stops excluding a private field or starts excluding a public one.
  function mockPublic(rows) {
    HistoryEvent.find = () => {
      let excluded = [];
      const chain = {
        select: (s) => { excluded = String(s).split(/\s+/).filter((x) => x.startsWith('-')).map((x) => x.slice(1)); return chain; },
        populate: () => chain, sort: () => chain, limit: () => chain,
        lean: async () => rows.map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => !excluded.includes(k)))),
      };
      return chain;
    };
    HistoryEvent.countDocuments = async () => rows.length;
  }
  test('imageUrl, imageAlt and imageCaption are returned; imagePublicId and editorial fields are not', async () => {
    mockPublic([{
      _id: oid(), title: 'T', section: 'origins', status: 'published',
      imageUrl: 'https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto/wwm/history/abc', imagePublicId: 'wwm/history/abc',
      imageAlt: 'Alt text', imageCaption: 'Caption text', reviewStatus: 'needs_confirmation', reviewNote: 'private', notes: 'private',
    }]);
    const r = await api('GET', '/api/history');
    assert.equal(r.status, 200);
    const item = r.json.data[0];
    assert.match(item.imageUrl, /^https:\/\/res\.cloudinary\.com\//);
    assert.equal(item.imageAlt, 'Alt text');
    assert.equal(item.imageCaption, 'Caption text');
    for (const k of ['imagePublicId', 'reviewStatus', 'reviewNote', 'notes', 'status']) assert.equal(item[k], undefined, `${k} must not be public`);
    assert.ok(!/"imagePublicId"/.test(r.text));
  });
});

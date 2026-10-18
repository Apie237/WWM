// Phase 10 tests: error handling, request guards, CORS/origin checks, login
// hardening, readiness, DB-connection behaviour, and production env checks.
// Same conventions as earlier phases: node:test, real Express app over real
// HTTP, Mongoose model methods mocked (no MongoDB in the sandbox).
import { test, describe, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { hashPassword, signAdminToken } from '../services/authService.js';
import { Continent, Country, User, News } from '../models/index.js';

let server;
let base;
before(async () => {
  server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

async function call(method, p, { body, headers = {} } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text, headers: res.headers };
}

const quiet = async (fn) => {
  const e = console.error; console.error = () => {};
  try { return await fn(); } finally { console.error = e; }
};

describe('central error handler', () => {
  const origFind = Continent.find;
  afterEach(() => { Continent.find = origFind; });
  const failWith = (err) => { Continent.find = () => { throw err; }; };

  test('unexpected errors → 500 with a generic message; internals and stack never returned', async () => {
    failWith(new Error('E11000-ish secret internal detail at mongodb://user:pass@host'));
    const r = await quiet(() => call('GET', '/api/continents'));
    assert.equal(r.status, 500);
    assert.equal(r.json.error, 'Something went wrong on our side. Please try again.');
    assert.ok(!/secret|mongodb|pass|at \S+\.js/.test(r.text));
  });
  test('the full error is still logged server-side (5xx only)', async () => {
    failWith(new Error('boom-for-logs'));
    const lines = [];
    const e = console.error; console.error = (...a) => lines.push(a.map(String).join(' '));
    try { await call('GET', '/api/continents'); } finally { console.error = e; }
    assert.ok(lines.join('\n').includes('boom-for-logs'));
  });
  test('Mongoose ValidationError → 400 with the field message', async () => {
    const err = new mongoose.Error.ValidationError();
    err.addError('status', new mongoose.Error.ValidatorError({ message: '`bogus` is not a valid enum value for path `status`.', path: 'status' }));
    failWith(err);
    const r = await call('GET', '/api/continents');
    assert.equal(r.status, 400);
    assert.match(r.json.error, /not a valid enum/);
  });
  test('CastError → 400 generic; duplicate key → 409', async () => {
    failWith(new mongoose.Error.CastError('ObjectId', 'zzz', '_id'));
    const a = await call('GET', '/api/continents');
    assert.equal(a.status, 400);
    assert.ok(!a.text.includes('zzz'));
    failWith(Object.assign(new Error('E11000 duplicate key error collection: wwm.x index: name_1'), { code: 11000 }));
    const b = await call('GET', '/api/continents');
    assert.equal(b.status, 409);
    assert.ok(!b.text.includes('wwm.x'));
  });
  test('database unavailable / buffering timeout → 503 with a friendly message', async () => {
    for (const err of [
      Object.assign(new Error('Server selection timed out after 5000 ms (host db.internal:27017)'), { name: 'MongooseServerSelectionError' }),
      new Error('Operation `continents.find()` buffering timed out after 5000ms'),
      Object.assign(new Error('connect ECONNREFUSED 10.0.0.5'), { name: 'MongoNetworkError' }),
    ]) {
      failWith(err);
      const r = await quiet(() => call('GET', '/api/continents'));
      assert.equal(r.status, 503);
      assert.match(r.json.error, /temporarily unavailable/);
      assert.ok(!/10\.0\.0|db\.internal|continents\.find/.test(r.text));
    }
  });
  test('malformed JSON → 400; oversized JSON body → 413', async () => {
    const bad = await call('POST', '/api/contact', { body: '{"name": ' });
    assert.equal(bad.status, 400);
    assert.match(bad.json.error, /Malformed JSON/);
    const big = await call('POST', '/api/contact', { body: JSON.stringify({ message: 'x'.repeat(150 * 1024) }) });
    assert.equal(big.status, 413);
  });
  test('deliberate ApiError 5xx messages (e.g. uploads not configured) are NOT masked', async () => {
    // Covered end-to-end by phase9Media.test.js ("missing Cloudinary configuration → clear 503").
    const { ApiError } = await import('../utils/apiError.js');
    failWith(new ApiError(503, 'Image uploads are not configured on this server.'));
    const r = await call('GET', '/api/continents');
    assert.equal(r.status, 503);
    assert.match(r.json.error, /not configured/);
  });
  test('unknown route → 404 JSON', async () => {
    const r = await call('GET', '/api/nope');
    assert.equal(r.status, 404);
  });
});

describe('query-parameter guard', () => {
  const origFindOne = Country.findOne;
  const origNewsFind = News.find;
  afterEach(() => { Country.findOne = origFindOne; News.find = origNewsFind; });

  test('repeated (array) query parameters → 400, nothing reaches the database', async () => {
    let touched = 0;
    Country.findOne = () => { touched++; return { select: () => ({ lean: async () => null }) }; };
    for (const p of ['/api/news?country=a&country=b', '/api/organizations?search=a&search=b', '/api/resources?type=a&type=b']) {
      assert.equal((await call('GET', p)).status, 400, p);
    }
    assert.equal(touched, 0);
  });
  test('operator-style keys (?country[$ne]=x) never become a Mongo operator object', async () => {
    const seen = [];
    Country.findOne = (filter) => { seen.push(filter); return { select: () => ({ lean: async () => null }) }; };
    News.find = () => ({ select: () => ({ populate: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ lean: async () => [] }) }) }) }) }) });
    News.countDocuments = async () => 0;
    const r = await call('GET', '/api/news?country[$ne]=zz');
    assert.ok(r.status < 500, String(r.status));
    for (const f of seen) assert.equal(typeof f.slug, 'string');
  });
  test('?search[a]=b no longer crashes the organizations list', async () => {
    const r = await call('GET', '/api/organizations?search[a]=b');
    assert.notEqual(r.status, 500);
  });
});

describe('origin protection and CORS', () => {
  const allowed = env.clientOrigins[0];

  test('state-changing auth request from a foreign Origin → 403', async () => {
    const r = await call('POST', '/api/auth/login', { body: { email: 'a@b.co', password: 'x' }, headers: { origin: 'https://evil.example' } });
    assert.equal(r.status, 403);
    const logout = await call('POST', '/api/auth/logout', { headers: { origin: 'https://evil.example' } });
    assert.equal(logout.status, 403);
    const admin = await call('DELETE', '/api/admin/news/507f1f77bcf86cd799439011', { headers: { origin: 'https://evil.example' } });
    assert.equal(admin.status, 403);
  });
  test('allowed Origin and no Origin both proceed to normal validation', async () => {
    assert.equal((await call('POST', '/api/auth/login', { body: {}, headers: { origin: allowed } })).status, 400);
    assert.equal((await call('POST', '/api/auth/login', { body: {} })).status, 400);
  });
  test('safe methods are never blocked by the origin check', async () => {
    assert.equal((await call('GET', '/api/auth/me', { headers: { origin: 'https://evil.example' } })).status, 401);
  });
  test('CORS: allowed origin gets credentialed headers, a foreign origin gets none', async () => {
    const ok = await call('OPTIONS', '/api/auth/login', { headers: { origin: allowed, 'access-control-request-method': 'POST' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), allowed);
    assert.equal(ok.headers.get('access-control-allow-credentials'), 'true');
    const bad = await call('OPTIONS', '/api/auth/login', { headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' } });
    assert.equal(bad.headers.get('access-control-allow-origin'), null);
  });
  test('admin and auth responses are marked no-store; helmet headers present', async () => {
    const r = await call('GET', '/api/auth/me');
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(r.headers.get('x-powered-by'), null);
    assert.equal((await call('GET', '/api/admin/dashboard')).headers.get('cache-control'), 'no-store');
  });
});

describe('login hardening', () => {
  const origFindOne = User.findOne;
  afterEach(() => { User.findOne = origFindOne; });
  const withUser = (user) => { User.findOne = () => ({ select: async () => user }); };
  const login = (password) => call('POST', '/api/auth/login', { body: { email: 'a@b.co', password } });

  test('unknown email and wrong password are indistinguishable (401, same message)', async () => {
    withUser(null);
    const unknown = await login('whatever');
    withUser({ passwordHash: await hashPassword('right-password'), isActive: true });
    const wrong = await login('wrong-password');
    assert.equal(unknown.status, 401);
    assert.equal(wrong.status, 401);
    assert.equal(unknown.json.error, wrong.json.error);
  });
  test('unknown email still performs a password hash comparison (timing equalised)', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const orig = bcrypt.compare;
    let calls = 0;
    bcrypt.compare = async (...a) => { calls++; return orig.apply(bcrypt, a); };
    try {
      withUser(null);
      await login('x');
    } finally { bcrypt.compare = orig; }
    assert.equal(calls, 1);
  });
  test('a disabled account is revealed only after the correct password', async () => {
    const hash = await hashPassword('right-password');
    withUser({ passwordHash: hash, isActive: false });
    assert.equal((await login('wrong-password')).status, 401);
    assert.equal((await login('right-password')).status, 403);
  });
});

describe('JWT verification', () => {
  const secret = env.jwtSecret;
  test('a token signed with a different algorithm or "none" is rejected', async () => {
    const payload = { sub: '507f1f77bcf86cd799439011', role: 'SUPER_ADMIN' };
    const hs512 = jwt.sign(payload, secret, { algorithm: 'HS512' });
    const none = jwt.sign(payload, '', { algorithm: 'none' });
    for (const t of [hs512, none, 'garbage']) {
      const r = await call('GET', '/api/auth/me', { headers: { authorization: `Bearer ${t}` } });
      assert.equal(r.status, 401);
    }
  });
  test('an expired token is rejected with the generic message', async () => {
    const t = jwt.sign({ sub: '507f1f77bcf86cd799439011', role: 'SUPER_ADMIN' }, secret, { algorithm: 'HS256', expiresIn: -10 });
    const r = await call('GET', '/api/auth/me', { headers: { authorization: `Bearer ${t}` } });
    assert.equal(r.status, 401);
    assert.match(r.json.error, /Invalid or expired session/);
  });
  test('a valid token for a deleted/disabled user is rejected', async () => {
    const orig = User.findById;
    User.findById = () => ({ populate: async () => null });
    try {
      const t = signAdminToken({ _id: new mongoose.Types.ObjectId(), role: 'SUPER_ADMIN', country: null });
      assert.equal((await call('GET', '/api/auth/me', { headers: { authorization: `Bearer ${t}` } })).status, 401);
    } finally { User.findById = orig; }
  });
});

describe('health and readiness', () => {
  test('/api/health is liveness (200 even with no database)', async () => {
    const r = await call('GET', '/api/health');
    assert.equal(r.status, 200);
    assert.equal(r.json.db, 'disconnected');
  });
  test('/api/health/ready is 503 without a database and leaks nothing', async () => {
    const r = await call('GET', '/api/health/ready');
    assert.equal(r.status, 503);
    assert.deepEqual(r.json, { status: 'unavailable' });
  });
  test('/api/health/ready is 200 when connected', async () => {
    const desc = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(mongoose.connection), 'readyState');
    Object.defineProperty(mongoose.connection, 'readyState', { get: () => 1, configurable: true });
    try {
      assert.equal((await call('GET', '/api/health/ready')).status, 200);
    } finally {
      delete mongoose.connection.readyState;
      if (desc && !Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState')) { /* prototype getter restored by delete */ }
    }
  });
});

describe('database connection helper', () => {
  test('concurrent callers share one attempt, with short timeouts', async () => {
    const orig = mongoose.connect;
    const calls = [];
    mongoose.connect = (uri, opts) => { calls.push(opts); return new Promise((r) => setTimeout(r, 20)); };
    try {
      await Promise.all([connectDB(), connectDB(), connectDB()]);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].serverSelectionTimeoutMS, 5000);
      assert.equal(calls[0].bufferTimeoutMS, 5000);
    } finally { mongoose.connect = orig; }
  });
  test('a failed attempt rejects, and the next call tries again', async () => {
    const orig = mongoose.connect;
    let n = 0;
    mongoose.connect = async () => { n++; throw new Error('nope'); };
    try {
      await assert.rejects(() => connectDB(), /nope/);
      await assert.rejects(() => connectDB(), /nope/);
      assert.equal(n, 2);
    } finally { mongoose.connect = orig; }
  });
});

describe('production environment validation', () => {
  const envModule = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), '../config/env.js')).href;
  // Run in a clean child process whose cwd has no .env file, so a developer's
  // local server/.env can never influence the result.
  const run = (vars) =>
    spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(envModule)}); console.log('LOADED')`], {
      cwd: tmpdir(),
      env: { PATH: process.env.PATH, ...vars },
      encoding: 'utf8',
    });
  const good = { NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40), MONGODB_URI: 'mongodb://h/db', CLIENT_ORIGIN: 'https://site.example' };

  test('a complete production configuration loads', () => {
    const r = run(good);
    assert.match(r.stdout, /LOADED/, r.stderr);
  });
  for (const missing of ['JWT_SECRET', 'MONGODB_URI', 'CLIENT_ORIGIN']) {
    test(`production without ${missing} fails fast with a clear message`, () => {
      const vars = { ...good }; delete vars[missing];
      const r = run(vars);
      assert.notEqual(r.status, 0);
      assert.match(r.stderr, new RegExp(`${missing} environment variable is required`));
    });
  }
  test('CLIENT_ORIGIN="*" is refused; a comma list is accepted', () => {
    assert.notEqual(run({ ...good, CLIENT_ORIGIN: '*' }).status, 0);
    assert.match(run({ ...good, CLIENT_ORIGIN: 'https://a.example, https://www.a.example/' }).stdout, /LOADED/);
  });
  test('development still works with no variables (local-dev experience unchanged)', () => {
    assert.match(run({}).stdout, /LOADED/);
  });
  test('a short production JWT_SECRET only warns', () => {
    const r = run({ ...good, JWT_SECRET: 'short' });
    assert.match(r.stdout, /LOADED/);
    assert.match(r.stderr + r.stdout, /shorter than 32/);
  });
});

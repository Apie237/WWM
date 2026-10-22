// Local-development CORS tests. A browser blocks a response that lacks
// Access-Control-Allow-Origin, and with a mismatched or malformed CLIENT_ORIGIN
// that is exactly what the frontend sees. These tests pin down: the dev origin
// works (including the OPTIONS preflight and the 401 from /api/auth/me), how
// CLIENT_ORIGIN values are normalised or rejected, that untrusted origins never
// get CORS headers (and never "*"), and that a blocked origin is explained.
// Same conventions as earlier phases: node:test, the real Express app over real
// HTTP, no MongoDB needed (none of these requests reaches the database).
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app.js';
import { env, parseClientOrigins } from '../config/env.js';

const probeFile = fileURLToPath(new URL('./helpers/corsProbe.mjs', import.meta.url));
const DEV = 'http://localhost:5173';
const EVIL = 'https://evil.example';

// Boots the real app in a child process with exactly this environment, in an
// empty working directory so no developer .env file can leak in.
function probe(vars, origins) {
  const r = spawnSync(process.execPath, [probeFile], {
    cwd: tmpdir(),
    encoding: 'utf8',
    timeout: 30000,
    env: { PATH: process.env.PATH, JWT_SECRET: 'x'.repeat(40), PROBE_ORIGINS: JSON.stringify(origins), ...vars },
  });
  const line = r.stdout.split('\n').find((l) => l.startsWith('RESULT '));
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, data: line ? JSON.parse(line.slice(7)) : null };
}

function assertAllowed(entry, origin) {
  assert.equal(entry.preflight.status, 204, 'preflight succeeds');
  assert.equal(entry.preflight.acao, origin, 'the exact origin is echoed, never "*"');
  assert.equal(entry.preflight.credentials, 'true');
  assert.match(entry.preflight.methods, /POST/);
  assert.match(entry.preflight.headers, /content-type/i);
  assert.match(entry.preflight.vary, /Origin/i);
  assert.equal(entry.me.status, 401, 'the unauthenticated /auth/me answer');
  assert.equal(entry.me.acao, origin, 'even the 401 carries CORS headers, so the browser lets the app read it');
  assert.equal(entry.me.credentials, 'true');
  assert.equal(entry.login.status, 400, 'an empty login body reaches validation');
  assert.equal(entry.login.acao, origin);
}
function assertBlocked(entry) {
  assert.equal(entry.preflight.acao, null);
  assert.equal(entry.preflight.credentials, null);
  assert.equal(entry.me.acao, null);
  assert.equal(entry.me.credentials, null);
  assert.equal(entry.login.acao, null);
}

describe('local development origin (child process, real environment parsing)', () => {
  test('with CLIENT_ORIGIN unset, http://localhost:5173 is allowed and other origins are not', () => {
    const r = probe({ NODE_ENV: 'development' }, [DEV, 'http://127.0.0.1:5173', 'http://localhost:3000', EVIL]);
    assert.deepEqual(r.data.allowlist, [DEV], r.stderr);
    assertAllowed(r.data.results[DEV], DEV);
    for (const o of ['http://127.0.0.1:5173', 'http://localhost:3000', EVIL]) assertBlocked(r.data.results[o]);
  });

  test('CLIENT_ORIGIN=http://localhost:5173 behaves the same', () => {
    const r = probe({ NODE_ENV: 'development', CLIENT_ORIGIN: DEV }, [DEV]);
    assertAllowed(r.data.results[DEV], DEV);
  });

  for (const [label, value] of [
    ['a trailing slash', `${DEV}/`],
    ['a path', `${DEV}/admin`],
    ['an upper-case scheme and host', 'HTTP://LOCALHOST:5173'],
    ['surrounding spaces', `  ${DEV}  `],
  ]) {
    test(`a value with ${label} is normalised and still matches the browser's origin`, () => {
      const r = probe({ NODE_ENV: 'development', CLIENT_ORIGIN: value }, [DEV]);
      assert.deepEqual(r.data.allowlist, [DEV], r.stderr);
      assertAllowed(r.data.results[DEV], DEV);
    });
  }

  test('a comma-separated list allows each listed origin and nothing else', () => {
    const r = probe({ NODE_ENV: 'development', CLIENT_ORIGIN: `${DEV}, https://www.example.org/` }, [DEV, 'https://www.example.org', EVIL]);
    assert.deepEqual(r.data.allowlist, [DEV, 'https://www.example.org']);
    assertAllowed(r.data.results[DEV], DEV);
    assertAllowed(r.data.results['https://www.example.org'], 'https://www.example.org');
    assertBlocked(r.data.results[EVIL]);
  });

  test('the reported symptom: a CLIENT_ORIGIN for another host/port gives the dev frontend no CORS headers — and the server says why', () => {
    const r = probe({ NODE_ENV: 'development', CLIENT_ORIGIN: 'http://127.0.0.1:5173' }, [DEV]);
    assertBlocked(r.data.results[DEV]);
    assert.match(r.stderr, /\[cors\] Blocked a request from origin "http:\/\/localhost:5173"/);
    assert.match(r.stderr, /Allowed origins: http:\/\/127\.0\.0\.1:5173/);
    assert.match(r.stderr, /CLIENT_ORIGIN/);
    assert.equal((r.stderr.match(/\[cors\] Blocked/g) || []).length, 1, 'reported once per origin, not once per request');
  });

  test('a value without a scheme (localhost:5173) is reported; alone it stops the server with a clear message', () => {
    const alone = probe({ NODE_ENV: 'development', CLIENT_ORIGIN: 'localhost:5173' }, [DEV]);
    assert.notEqual(alone.status, 0);
    assert.match(alone.stderr, /Ignoring invalid CLIENT_ORIGIN entry: "localhost:5173"/);
    assert.match(alone.stderr, /no valid origin/);
    const mixed = probe({ NODE_ENV: 'development', CLIENT_ORIGIN: `localhost:5173,${DEV}` }, [DEV]);
    assert.match(mixed.stderr, /Ignoring invalid CLIENT_ORIGIN entry: "localhost:5173"/);
    assertAllowed(mixed.data.results[DEV], DEV);
  });

  test('wildcards are refused outright', () => {
    for (const value of ['*', `${DEV},*`, 'https://*.example.org']) {
      const r = probe({ NODE_ENV: 'development', CLIENT_ORIGIN: value }, [DEV]);
      assert.notEqual(r.status, 0, value);
      assert.match(r.stderr, /explicit origins, not "\*"/, value);
    }
  });

  test('in production the blocked-origin hint is not logged (and the allowlist is unchanged)', () => {
    const r = probe({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://127.0.0.1:1/none', CLIENT_ORIGIN: 'https://site.example' }, [EVIL, 'https://site.example']);
    assertBlocked(r.data.results[EVIL]);
    assertAllowed(r.data.results['https://site.example'], 'https://site.example');
    assert.ok(!/\[cors\]/.test(r.stderr), r.stderr);
  });
});

describe('preflight and trusted-origin behaviour (in process)', () => {
  let server;
  let base;
  const allowed = env.clientOrigins[0];
  before(async () => {
    server = http.createServer(createApp());
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => new Promise((r) => server.close(r)));
  const preflight = (p, origin, method = 'POST') =>
    fetch(base + p, { method: 'OPTIONS', headers: { origin, 'access-control-request-method': method, 'access-control-request-headers': 'content-type' } });

  test('preflight succeeds for the allowed origin on auth, admin and public routes', async () => {
    for (const [p, method] of [['/api/auth/login', 'POST'], ['/api/auth/logout', 'POST'], ['/api/auth/me', 'GET'], ['/api/admin/dashboard', 'GET'], ['/api/admin/news', 'POST'], ['/api/admin/news/507f1f77bcf86cd799439011', 'DELETE'], ['/api/history', 'GET']]) {
      const r = await preflight(p, allowed, method);
      assert.equal(r.status, 204, p);
      assert.equal(r.headers.get('access-control-allow-origin'), allowed, p);
      assert.equal(r.headers.get('access-control-allow-credentials'), 'true', p);
      assert.ok(r.headers.get('access-control-allow-methods').includes(method), p);
    }
  });

  test('preflight from an untrusted origin gets no CORS headers, never "*", never credentials', async () => {
    for (const p of ['/api/auth/login', '/api/auth/me', '/api/admin/dashboard', '/api/history']) {
      const r = await preflight(p, EVIL);
      assert.equal(r.headers.get('access-control-allow-origin'), null, p);
      assert.equal(r.headers.get('access-control-allow-credentials'), null, p);
      assert.notEqual(r.headers.get('access-control-allow-origin'), '*');
    }
  });

  test('a state-changing request from an untrusted origin is refused (403) and carries no CORS headers', async () => {
    const r = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { origin: EVIL, 'content-type': 'application/json' }, body: '{"email":"a@b.co","password":"x"}' });
    assert.equal(r.status, 403);
    assert.equal(r.headers.get('access-control-allow-origin'), null);
    assert.equal((await r.json()).error, 'Request origin is not allowed.');
  });

  test('the allowed origin still gets no-store on auth responses, plus CORS headers on the 401', async () => {
    const r = await fetch(`${base}/api/auth/me`, { headers: { origin: allowed } });
    assert.equal(r.status, 401);
    assert.equal(r.headers.get('access-control-allow-origin'), allowed);
    assert.equal(r.headers.get('cache-control'), 'no-store');
  });

  test('requests with no Origin header (curl, server-to-server) are unaffected', async () => {
    const r = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(r.status, 400);
    assert.equal(r.headers.get('access-control-allow-origin'), null);
  });

  test('a hostile Origin header cannot forge log lines', async () => {
    const lines = [];
    const orig = console.warn;
    console.warn = (...a) => lines.push(a.join(' '));
    try {
      const { corsOrigin } = await import('../middleware/security.js');
      corsOrigin('https://x.example\n[cors] forged line', () => {});
    } finally { console.warn = orig; }
    for (const l of lines) assert.ok(!l.includes('\n'), 'the origin is JSON-quoted, so a newline stays escaped');
  });
});

describe('parseClientOrigins', () => {
  test('reduces entries to origins, de-duplicates, and reports invalid ones', () => {
    assert.deepEqual(parseClientOrigins('http://localhost:5173/, HTTP://LOCALHOST:5173 ,https://a.example/x?y=1'), { origins: ['http://localhost:5173', 'https://a.example'], invalid: [] });
    assert.deepEqual(parseClientOrigins('localhost:5173, ftp://h.example, ,http://ok.example:8080'), { origins: ['http://ok.example:8080'], invalid: ['localhost:5173', 'ftp://h.example'] });
  });
  test('treats localhost and 127.0.0.1 as different origins', () => {
    assert.deepEqual(parseClientOrigins('http://localhost:5173,http://127.0.0.1:5173').origins, ['http://localhost:5173', 'http://127.0.0.1:5173']);
  });
  test('rejects a wildcard anywhere', () => {
    assert.throws(() => parseClientOrigins('*'), /explicit origins/);
    assert.throws(() => parseClientOrigins('https://*.a.example'), /explicit origins/);
  });
});

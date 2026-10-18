// Runs with TRUST_PROXY=1 (helper imported first): the login rate limiter must
// key on the client address in X-Forwarded-For, not on the proxy's socket IP,
// so one user's failed attempts cannot lock out everyone else behind the proxy.
import './helpers/trustProxyOne.js';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../app.js';
import { env } from '../config/env.js';

let server;
let base;
before(async () => {
  server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

const login = (ip) =>
  fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({}),
  }).then((r) => r.status);

test('TRUST_PROXY=1 is honoured', () => {
  assert.equal(env.trustProxy, 1);
});

test('login limiter is per client IP behind the proxy', async () => {
  for (let i = 0; i < 10; i++) assert.equal(await login('203.0.113.7'), 400);
  assert.equal(await login('203.0.113.7'), 429, 'the abusive client is limited');
  assert.equal(await login('198.51.100.9'), 400, 'a different client is unaffected');
});

// Verifies the production-default rate limit on the public write endpoints
// (no PUBLIC_SUBMISSION_LIMIT override: this file runs in its own process).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../app.js';
import { ContactMessage, PrayerRequest } from '../models/index.js';

let server;
let base;
before(async () => {
  server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

const post = (path, body) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.status);

test('contact form: 5 submissions per window succeed, the 6th is 429', async () => {
  const orig = ContactMessage.create;
  ContactMessage.create = async () => ({ _id: 'x' });
  try {
    const statuses = [];
    for (let i = 0; i < 7; i++) statuses.push(await post('/api/contact', { name: 'N', email: 'n@x.org', message: 'm' }));
    assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429, 429]);
  } finally { ContactMessage.create = orig; }
});

test('prayer requests have their own independent limit (also 5, then 429)', async () => {
  const orig = PrayerRequest.create;
  PrayerRequest.create = async () => ({ _id: 'x', status: 'pending' });
  try {
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push(await post('/api/prayer-requests', { request: 'r' }));
    assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429]);
  } finally { PrayerRequest.create = orig; }
});

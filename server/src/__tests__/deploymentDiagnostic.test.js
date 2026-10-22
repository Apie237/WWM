// Tests for the read-only deployment comparison (scripts/checkDeployment.js and
// scripts/lib/deploymentCheck.js): it must only send unauthenticated GETs, tell
// older deployments from current ones, and tell "same database" from "different
// database" by comparing document ids. No MongoDB or network needed.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { HistoryEvent } from '../models/index.js';
import { normalizeApiBase, probeDeployment, describeDeployment, compareIds } from '../scripts/lib/deploymentCheck.js';

const oid = () => new mongoose.Types.ObjectId().toString();

describe('normalizeApiBase', () => {
  test('turns a site address into the /api base', () => {
    for (const input of ['https://wwm-beta.vercel.app', 'https://wwm-beta.vercel.app/', 'https://wwm-beta.vercel.app/api', 'https://wwm-beta.vercel.app/api/', 'HTTPS://WWM-BETA.vercel.app/x?y=1']) {
      assert.equal(normalizeApiBase(input), 'https://wwm-beta.vercel.app/api', input);
    }
  });
  test('rejects plain http, credentials in the URL and garbage', () => {
    assert.throws(() => normalizeApiBase('http://wwm-beta.vercel.app'), /https/);
    assert.throws(() => normalizeApiBase('https://user:pass@wwm-beta.vercel.app'), /credentials/);
    assert.throws(() => normalizeApiBase('wwm-beta.vercel.app'), /full URL/);
  });
});

describe('probe sends only unauthenticated GET requests', () => {
  test('never uses another method, a body, an Authorization header, or the login endpoint', async () => {
    const calls = [];
    const fake = async (url, init) => {
      calls.push({ url, init });
      return { status: 200, headers: { get: () => null }, json: async () => ({ data: [{ _id: 'a' }], pagination: { total: 1 } }) };
    };
    await probeDeployment('https://x.example/api', fake);
    assert.ok(calls.length >= 4);
    for (const { url, init } of calls) {
      assert.equal(init.method, 'GET');
      assert.equal(init.body, undefined);
      assert.equal(init.headers, undefined, 'no Authorization or cookie headers');
      assert.equal(init.redirect, 'manual');
      assert.ok(!/login|logout|admin/.test(url), url);
    }
  });
  test('a network failure is reported, not thrown', async () => {
    const p = await probeDeployment('https://x.example/api', async () => { throw new TypeError('fetch failed'); });
    assert.equal(p.health.status, 0);
    assert.match(describeDeployment(p).join('\n'), /Could not reach the API/);
  });
});

describe('fingerprint against the real application (real HTTP, no database)', () => {
  let server;
  let base;
  const orig = { find: HistoryEvent.find, count: HistoryEvent.countDocuments };
  const ids = [oid(), oid(), oid()];
  before(async () => {
    HistoryEvent.find = () => {
      const chain = { select: () => chain, populate: () => chain, sort: () => chain, limit: () => chain, lean: async () => ids.map((_id) => ({ _id, title: 't' })) };
      return chain;
    };
    HistoryEvent.countDocuments = async () => ids.length;
    server = http.createServer(createApp());
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}/api`;
  });
  after(async () => {
    HistoryEvent.find = orig.find; HistoryEvent.countDocuments = orig.count;
    await new Promise((r) => server.close(r));
  });

  test('the current code is recognised as Phase 10 + History, and its document ids are returned', async () => {
    const p = await probeDeployment(base);
    assert.equal(p.health.status, 200);
    assert.equal(p.ready.status, 503, 'readiness exists; this process has no database');
    assert.equal(p.queryGuard.status, 400);
    assert.equal(p.me.status, 401);
    assert.match(p.me.cache, /no-store/);
    assert.deepEqual(p.history.ids, ids);
    assert.equal(p.history.total, 3);
    const text = describeDeployment(p).join('\n');
    assert.match(text, /Phase 10 or later/);
    assert.ok(!/OLDER/.test(text), text);
  });
});

describe('describeDeployment recognises older deployments', () => {
  const modern = () => ({
    health: { status: 200, body: { db: 'connected' } },
    ready: { status: 200 },
    history: { status: 200, total: 15, ids: [] },
    me: { status: 401, cache: 'no-store' },
    queryGuard: { status: 400 },
  });
  test('no readiness endpoint, no query guard, no no-store -> older than Phase 10', () => {
    const p = { ...modern(), ready: { status: 404 }, queryGuard: { status: 200 }, me: { status: 401, cache: null } };
    const text = describeDeployment(p).join('\n');
    assert.match(text, /OLDER than Phase 10 \(no readiness endpoint\)/);
    assert.match(text, /Repeated-query guard: absent/);
    assert.match(text, /not the Phase 10 behaviour/);
  });
  test('no History endpoint -> older than the History feature', () => {
    assert.match(describeDeployment({ ...modern(), history: { status: 404, ids: [] } }).join('\n'), /OLDER than the History feature/);
  });
  test('a database that is not connected is called out', () => {
    assert.match(describeDeployment({ ...modern(), ready: { status: 503 } }).join('\n'), /NOT connected to a database/);
  });
  test('says that the exact commit must come from the Vercel dashboard', () => {
    assert.match(describeDeployment(modern()).join('\n'), /commit in the Vercel dashboard/);
  });
});

describe('compareIds', () => {
  const a = oid(); const b = oid(); const c = oid();
  test('identical documents -> same database', () => {
    const r = compareIds([a, b], [b, a, c]);
    assert.equal(r.matching, 2);
    assert.match(r.verdict, /^SAME DATABASE/);
  });
  test('no shared documents -> different database', () => {
    assert.match(compareIds([a, b], [c]).verdict, /^DIFFERENT DATABASE/);
  });
  test('some shared documents -> partial overlap, not a pass', () => {
    assert.match(compareIds([a, b], [a, c]).verdict, /^PARTIAL OVERLAP \(1 of 2\)/);
  });
  test('nothing to compare -> unknown, never "same"', () => {
    assert.match(compareIds([], [a]).verdict, /^UNKNOWN/);
  });
});

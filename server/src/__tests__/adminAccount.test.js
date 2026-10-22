// Admin account access tests: the seed → stored hash → login chain, the
// "#"-in-.env password trap, create-only seeding, the read-only check, and the
// explicit password reset. Same conventions as earlier phases: node:test, a
// real Express app over real HTTP, Mongoose model methods mocked (no MongoDB).
//
// NOTE: POST /api/auth/login is rate limited to 10 attempts per 15 minutes per
// IP and node --test runs this file in its own process, so the HTTP tests below
// deliberately make fewer than 10 login requests in total.
import { test, describe, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createApp } from '../app.js';
import { User } from '../models/index.js';
import { hashPassword } from '../services/authService.js';
import { seedAdmin } from '../scripts/seedAdmin.js';
import { envValueWarnings, inspectAccount, describeInspection, resetAdminPassword } from '../scripts/lib/adminTools.js';

let server;
let base;
before(async () => {
  server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

async function login(email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text, headers: res.headers };
}

// A one-collection stand-in for the User model, honouring just what the code
// under test calls. `calls` records every write so tests can assert on them.
const orig = {};
function fakeUsers(initial = []) {
  const rows = initial.map((u) => makeRow(u));
  const calls = { create: 0, updateOne: [], updateMany: 0, findOneAndUpdate: 0 };
  for (const k of ['findOne', 'create', 'updateOne', 'updateMany', 'findOneAndUpdate', 'countDocuments']) orig[k] ??= User[k];
  User.findOne = (filter) => ({ select: async () => rows.find((r) => r.email === filter.email) ?? null });
  User.create = async (doc) => {
    calls.create++;
    if (rows.some((r) => r.email === doc.email)) throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
    const row = makeRow(doc);
    rows.push(row);
    return row;
  };
  User.updateOne = async (filter, update) => {
    calls.updateOne.push({ filter, update });
    const row = rows.find((r) => String(r._id) === String(filter._id));
    if (row) Object.assign(row, update.$set);
    return { modifiedCount: row ? 1 : 0 };
  };
  User.updateMany = async () => { calls.updateMany++; return { modifiedCount: 0 }; };
  User.findOneAndUpdate = async () => { calls.findOneAndUpdate++; return null; };
  User.countDocuments = async () => rows.length;
  return { rows, calls };
}
function makeRow(u) {
  return { _id: new mongoose.Types.ObjectId(), isActive: true, country: null, lastLoginAt: null, save: async function save() { return this; }, populate: async function populate() { return this; }, ...u };
}
afterEach(() => { for (const [k, v] of Object.entries(orig)) User[k] = v; });

const silent = { log: () => {}, error: () => {} };

describe('seeded account → login (real HTTP, real bcrypt)', () => {
  test('the account the seed creates can log in with the seeded password; the response never contains a hash', async () => {
    const { rows } = fakeUsers();
    await seedAdmin({ name: 'Dev Admin', email: 'dev-admin@wwm.local', password: 'a-good-password-1', ...silent });
    assert.equal(rows.length, 1);
    const r = await login('dev-admin@wwm.local', 'a-good-password-1');
    assert.equal(r.status, 200);
    assert.equal(r.json.data.admin.role, 'SUPER_ADMIN');
    assert.match(r.headers.get('set-cookie'), /wwm_admin_token=.+HttpOnly/i);
    assert.ok(!/\$2[aby]\$|passwordHash/.test(r.text), 'no hash in the response');
  });

  test('the email is matched however it is typed (case and surrounding spaces)', async () => {
    fakeUsers();
    await seedAdmin({ name: 'Dev Admin', email: '  Dev-Admin@WWM.local ', password: 'a-good-password-1', ...silent });
    const r = await login('  DEV-ADMIN@wwm.local  ', 'a-good-password-1');
    assert.equal(r.status, 200);
  });

  test('a wrong password is refused (401) with the generic message', async () => {
    fakeUsers();
    await seedAdmin({ name: 'Dev Admin', email: 'dev-admin@wwm.local', password: 'a-good-password-1', ...silent });
    const r = await login('dev-admin@wwm.local', 'a-good-password-2');
    assert.equal(r.status, 401);
    assert.equal(r.json.error, 'Invalid email or password.');
  });

  test('"#" in an unquoted .env value truncates the stored password, so the full password no longer works — quoting fixes it', async () => {
    const intended = 'MyLongPassword#2026!';
    const unquoted = dotenv.parse(`ADMIN_SEED_PASSWORD=${intended}`).ADMIN_SEED_PASSWORD;
    const quoted = dotenv.parse(`ADMIN_SEED_PASSWORD="${intended}"`).ADMIN_SEED_PASSWORD;
    assert.equal(unquoted, 'MyLongPassword', 'dotenv stops at the unquoted #');
    assert.equal(quoted, intended);
    assert.ok(unquoted.length >= 10, 'the truncated value still passes the 10-character check — the trap is silent');

    fakeUsers();
    await seedAdmin({ name: 'Dev Admin', email: 'dev-admin@wwm.local', password: unquoted, ...silent });
    assert.equal((await login('dev-admin@wwm.local', intended)).status, 401, 'the password the person believes they set is refused');
  });

  test('a disabled account is refused (403) only after the correct password', async () => {
    fakeUsers([{ email: 'off@wwm.local', passwordHash: await hashPassword('a-good-password-1'), role: 'SUPER_ADMIN', isActive: false }]);
    const r = await login('off@wwm.local', 'a-good-password-1');
    assert.equal(r.status, 403);
    assert.match(r.json.error, /disabled/i);
  });

  test('reset: only the password hash changes; the old password stops working and the new one works', async () => {
    const { rows, calls } = fakeUsers([{ email: 'dev-admin@wwm.local', passwordHash: await hashPassword('old-password-123'), role: 'SUPER_ADMIN' }]);
    const before = { role: rows[0].role, isActive: rows[0].isActive, country: rows[0].country };
    await resetAdminPassword({ email: ' Dev-Admin@wwm.local ', password: 'new-password-456', nodeEnv: 'development' });
    assert.equal((await login('dev-admin@wwm.local', 'old-password-123')).status, 401);
    assert.equal((await login('dev-admin@wwm.local', 'new-password-456')).status, 200);
    assert.deepEqual({ role: rows[0].role, isActive: rows[0].isActive, country: rows[0].country }, before);
    assert.equal(calls.updateOne.length, 1);
    assert.deepEqual(Object.keys(calls.updateOne[0].update), ['$set']);
    assert.deepEqual(Object.keys(calls.updateOne[0].update.$set), ['passwordHash']);
  });
});

describe('seed:admin is create-only', () => {
  test('creates a SUPER_ADMIN when missing, with a bcrypt hash of the password and no password in the output', async () => {
    const { rows, calls } = fakeUsers();
    const lines = [];
    const res = await seedAdmin({ name: 'Dev Admin', email: 'Dev-Admin@WWM.local', password: 'a-good-password-1', log: (l) => lines.push(l), error: (l) => lines.push(l) });
    assert.equal(res.status, 'created');
    assert.equal(calls.create, 1);
    assert.equal(rows[0].email, 'dev-admin@wwm.local');
    assert.equal(rows[0].role, 'SUPER_ADMIN');
    assert.equal(rows[0].isActive, true);
    assert.ok(await bcrypt.compare('a-good-password-1', rows[0].passwordHash));
    assert.ok(!lines.join('\n').includes('a-good-password-1'));
  });

  test('an existing account is left completely untouched — password, role and active flag — and the output says so', async () => {
    const hash = await hashPassword('the-existing-password');
    const { rows, calls } = fakeUsers([{ email: 'dev-admin@wwm.local', passwordHash: hash, role: 'CONTENT_EDITOR', isActive: false }]);
    const lines = [];
    const res = await seedAdmin({ name: 'X', email: 'dev-admin@wwm.local', password: 'a-different-password', log: (l) => lines.push(l), error: (l) => lines.push(l) });
    assert.equal(res.status, 'exists');
    assert.equal(calls.create, 0);
    assert.equal(calls.updateOne.length, 0);
    assert.equal(calls.updateMany, 0);
    assert.equal(calls.findOneAndUpdate, 0);
    assert.equal(rows[0].passwordHash, hash);
    assert.equal(rows[0].role, 'CONTENT_EDITOR');
    assert.equal(rows[0].isActive, false);
    assert.match(lines.join('\n'), /already exists/);
    assert.match(lines.join('\n'), /admin:reset-password/);
    assert.ok(!lines.join('\n').includes('a-different-password'));
  });

  test('a duplicate-key race is reported as "exists", not as a crash', async () => {
    fakeUsers();
    User.findOne = () => ({ select: async () => null });
    User.create = async () => { throw Object.assign(new Error('dup'), { code: 11000 }); };
    assert.equal((await seedAdmin({ name: 'A', email: 'a@b.co', password: 'a-good-password-1', ...silent })).status, 'exists');
  });

  test('refuses missing variables and short passwords without touching the database', async () => {
    const { calls } = fakeUsers();
    assert.equal((await seedAdmin({ name: 'A', email: 'a@b.co', password: '', ...silent })).status, 'invalid');
    assert.equal((await seedAdmin({ name: 'A', email: 'a@b.co', password: 'short', ...silent })).status, 'invalid');
    assert.equal(calls.create, 0);
  });
});

describe('.env "#" warning', () => {
  const tmp = (text) => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'wwm-env-')), '.env');
    fs.writeFileSync(file, text);
    return file;
  };
  test('warns about an unquoted "#" and never prints the value', () => {
    const w = envValueWarnings('ADMIN_SEED_PASSWORD', tmp('A=1\nADMIN_SEED_PASSWORD=Secret#Value99\n'));
    assert.equal(w.length, 1);
    assert.match(w[0], /double quotes/);
    assert.ok(!w[0].includes('Secret') && !w[0].includes('Value99'));
  });
  test('no warning for a quoted value, a value without "#", a missing variable or a missing file', () => {
    assert.deepEqual(envValueWarnings('P', tmp('P="Secret#Value99"\n')), []);
    assert.deepEqual(envValueWarnings('P', tmp("P='Secret#Value99'\n")), []);
    assert.deepEqual(envValueWarnings('P', tmp('P=SecretValue99\n')), []);
    assert.deepEqual(envValueWarnings('Q', tmp('P=Secret#1\n')), []);
    assert.deepEqual(envValueWarnings('P', path.join(os.tmpdir(), 'definitely-not-here', '.env')), []);
  });
  test('the last definition wins, as in dotenv', () => {
    assert.equal(envValueWarnings('P', tmp('P=Secret#1\nP="ok#fine"\n')).length, 0);
    assert.equal(envValueWarnings('P', tmp('P="ok#fine"\nP=Secret#1\n')).length, 1);
  });
});

describe('admin:check (read-only inspection)', () => {
  test('reports an unknown email', async () => {
    fakeUsers();
    const info = await inspectAccount('nobody@wwm.local', 'x');
    assert.equal(info.found, false);
    assert.match(describeInspection(info, { totalAccounts: 0 }).join('\n'), /No account with this email/);
  });
  test('tells a matching password from a non-matching one, without exposing the hash', async () => {
    const { calls } = fakeUsers([{ email: 'a@wwm.local', passwordHash: await hashPassword('a-good-password-1'), role: 'SUPER_ADMIN' }]);
    const ok = await inspectAccount('A@wwm.local', 'a-good-password-1');
    const bad = await inspectAccount('a@wwm.local', 'nope-nope-nope');
    const none = await inspectAccount('a@wwm.local');
    assert.equal(ok.passwordMatches, true);
    assert.equal(bad.passwordMatches, false);
    assert.equal(none.passwordMatches, null);
    for (const info of [ok, bad, none]) assert.ok(!JSON.stringify(info).includes('$2'));
    assert.match(describeInspection(ok).join('\n'), /MATCHES/);
    assert.match(describeInspection(bad).join('\n'), /does NOT match/);
    assert.equal(calls.create + calls.updateOne.length + calls.updateMany + calls.findOneAndUpdate, 0, 'strictly read-only');
  });
  test('flags a disabled account and an invalid stored hash', async () => {
    fakeUsers([{ email: 'a@wwm.local', passwordHash: 'not-a-bcrypt-hash', role: 'SUPER_ADMIN', isActive: false }]);
    const text = describeInspection(await inspectAccount('a@wwm.local', 'x')).join('\n');
    assert.match(text, /DISABLED/);
    assert.match(text, /NOT a valid bcrypt hash/);
  });
});

describe('admin:reset-password safety', () => {
  test('refuses to run in production and writes nothing', async () => {
    const { calls } = fakeUsers([{ email: 'a@wwm.local', passwordHash: 'x', role: 'SUPER_ADMIN' }]);
    await assert.rejects(resetAdminPassword({ email: 'a@wwm.local', password: 'a-good-password-1', nodeEnv: 'production' }), /production/);
    assert.equal(calls.updateOne.length, 0);
  });
  test('never creates an account: an unknown email is an error and changes nothing', async () => {
    const { rows, calls } = fakeUsers([{ email: 'a@wwm.local', passwordHash: 'x', role: 'SUPER_ADMIN' }]);
    await assert.rejects(resetAdminPassword({ email: 'other@wwm.local', password: 'a-good-password-1', nodeEnv: 'development' }), /No account/);
    assert.equal(calls.create, 0);
    assert.equal(calls.updateOne.length, 0);
    assert.equal(rows.length, 1);
  });
  test('rejects a short password and does not touch other accounts', async () => {
    const { rows, calls } = fakeUsers([
      { email: 'a@wwm.local', passwordHash: 'hash-a', role: 'SUPER_ADMIN' },
      { email: 'b@wwm.local', passwordHash: 'hash-b', role: 'COUNTRY_ADMIN' },
    ]);
    await assert.rejects(resetAdminPassword({ email: 'a@wwm.local', password: 'short', nodeEnv: 'development' }), /at least 10/);
    await resetAdminPassword({ email: 'a@wwm.local', password: 'a-good-password-1', nodeEnv: 'development' });
    assert.equal(rows[1].passwordHash, 'hash-b');
    assert.equal(calls.updateMany, 0);
    assert.equal(calls.updateOne.length, 1);
    assert.equal(String(calls.updateOne[0].filter._id), String(rows[0]._id));
  });
  test('the command refuses NODE_ENV=production before connecting to anything', () => {
    const script = fileURLToPath(new URL('../scripts/resetAdminPassword.js', import.meta.url));
    const r = spawnSync(process.execPath, [script, '--email', 'a@wwm.local'], {
      encoding: 'utf8',
      timeout: 20000,
      env: { PATH: process.env.PATH, NODE_ENV: 'production', MONGODB_URI: 'mongodb://127.0.0.1:1/none', CLIENT_ORIGIN: 'https://example.org', JWT_SECRET: 'x'.repeat(40) },
    });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Refusing to run while NODE_ENV=production/);
    assert.ok(!/connected/.test(r.stdout));
  });
});

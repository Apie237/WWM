// Deployment-configuration tests: the two Vercel projects' config files, the
// production cookie attributes, the build-time guard against a localhost API
// URL, and the real Vercel entry (server/api/index.js) loaded in production
// mode. What these cannot show — Vercel's own runtime, Atlas, DNS, the browser's
// third-party-cookie behaviour — is listed in docs/DEPLOYMENT.md.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { checkProductionApiUrl } from '../../../client/deploy/checkApiUrl.js';

const serverRoot = fileURLToPath(new URL('../..', import.meta.url));
const clientRoot = path.resolve(serverRoot, '../client');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const PROD_ENV = { NODE_ENV: 'production', VERCEL: '1', JWT_SECRET: 'k'.repeat(40), MONGODB_URI: 'mongodb://127.0.0.1:1/none', CLIENT_ORIGIN: 'https://wwm-web.vercel.app' };

describe('backend project (root directory: server)', () => {
  const cfg = readJson(path.join(serverRoot, 'vercel.json'));
  test('exposes the Express app through api/index.js, which exists and exports a handler', async () => {
    assert.deepEqual(cfg.builds, [{ src: 'api/index.js', use: '@vercel/node' }]);
    assert.ok(cfg.rewrites.some((r) => r.source === '/(.*)' && r.destination === '/api/index.js'), 'every path reaches the function with its original URL');
    assert.ok(fs.existsSync(path.join(serverRoot, 'api/index.js')));
    const src = fs.readFileSync(path.join(serverRoot, 'api/index.js'), 'utf8');
    assert.match(src, /export default function handler/);
    assert.match(src, /connectDB\(\)/);
  });
  test('the server is an ES-module package (what @vercel/node expects for the import syntax used)', () => {
    assert.equal(readJson(path.join(serverRoot, 'package.json')).type, 'module');
  });
});

describe('frontend project (root directory: client)', () => {
  const cfg = readJson(path.join(clientRoot, 'vercel.json'));
  test('builds with Vite into dist and falls back to index.html so deep links work', () => {
    assert.equal(cfg.buildCommand, 'npm run build');
    assert.equal(cfg.outputDirectory, 'dist');
    assert.ok(cfg.rewrites.some((r) => r.source === '/(.*)' && r.destination === '/index.html'));
    assert.equal(readJson(path.join(clientRoot, 'package.json')).scripts.build, 'vite build');
  });
  test('sends the security headers and caches hashed assets', () => {
    const all = Object.fromEntries(cfg.headers.find((h) => h.source === '/(.*)').headers.map((h) => [h.key, h.value]));
    assert.equal(all['X-Content-Type-Options'], 'nosniff');
    assert.equal(all['X-Frame-Options'], 'DENY');
    assert.ok(all['Referrer-Policy']);
    assert.match(cfg.headers.find((h) => h.source === '/assets/(.*)').headers[0].value, /immutable/);
  });
  test('robots.txt keeps the admin area out of search results', () => {
    assert.match(fs.readFileSync(path.join(clientRoot, 'public/robots.txt'), 'utf8'), /Disallow:\s*\/admin/);
  });
});

describe('build-time guard for VITE_API_URL (client/deploy/checkApiUrl.js, used by vite.config.js)', () => {
  test('accepts an https API URL', () => {
    assert.equal(checkProductionApiUrl('https://wwm-api.vercel.app/api'), null);
  });
  test('rejects a missing value, a local address and plain http', () => {
    assert.match(checkProductionApiUrl(undefined), /not set/);
    assert.match(checkProductionApiUrl(''), /not set/);
    for (const url of ['http://localhost:5000/api', 'https://localhost/api', 'http://127.0.0.1:5000/api', 'https://127.0.0.1/api', 'http://[::1]:5000/api']) {
      assert.match(checkProductionApiUrl(url), /local address/, url);
    }
    assert.match(checkProductionApiUrl('http://api.example.org/api'), /https/);
  });
  test('vite.config.js applies it only to Vercel production builds', () => {
    const cfg = fs.readFileSync(path.join(clientRoot, 'vite.config.js'), 'utf8');
    assert.match(cfg, /process\.env\.VERCEL && mode === 'production'/);
    assert.match(cfg, /checkProductionApiUrl/);
  });
});

describe('production cookie attributes (cross-site frontend and API)', () => {
  const cookieOptions = (nodeEnv) => {
    const mod = pathToFileURL(path.join(serverRoot, 'src/config/auth.js')).href;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', `const m = await import(${JSON.stringify(mod)}); console.log(JSON.stringify({ set: m.adminCookieOptions(), clear: m.adminClearCookieOptions() }))`], {
      cwd: tmpdir(), encoding: 'utf8', env: { PATH: process.env.PATH, ...PROD_ENV, NODE_ENV: nodeEnv },
    });
    return JSON.parse(r.stdout);
  };
  test('production: httpOnly, Secure, SameSite=None, site-wide path', () => {
    const { set, clear } = cookieOptions('production');
    assert.deepEqual({ httpOnly: set.httpOnly, secure: set.secure, sameSite: set.sameSite, path: set.path }, { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
    assert.equal(clear.maxAge, undefined, 'logout must be able to clear it');
    assert.deepEqual({ secure: clear.secure, sameSite: clear.sameSite }, { secure: true, sameSite: 'none' });
  });
  test('development: httpOnly, not Secure (plain http), SameSite=Lax', () => {
    const { set } = cookieOptions('development');
    assert.deepEqual({ httpOnly: set.httpOnly, secure: set.secure, sameSite: set.sameSite }, { httpOnly: true, secure: false, sameSite: 'lax' });
  });
});

describe('the real Vercel entry in production mode (database unreachable)', () => {
  const run = () => {
    const r = spawnSync(process.execPath, [fileURLToPath(new URL('./helpers/vercelEntryProbe.mjs', import.meta.url))], {
      cwd: tmpdir(), encoding: 'utf8', timeout: 90000, env: { PATH: process.env.PATH, ...PROD_ENV },
    });
    const line = r.stdout.split('\n').find((l) => l.startsWith('RESULT '));
    assert.ok(line, r.stderr);
    return JSON.parse(line.slice(7));
  };
  const out = run();
  test('trusts exactly one proxy hop on Vercel, so rate limits see real client IPs', () => {
    assert.equal(out.trustProxy, 1);
    assert.equal(out.nodeEnv, 'production');
  });
  test('liveness answers even though the database is down', () => {
    assert.equal(out.health.status, 200);
    assert.equal(JSON.parse(out.health.body).db, 'disconnected');
  });
  test('only the configured frontend origin gets credentialed CORS headers', () => {
    assert.equal(out.preflightSite.status, 204);
    assert.equal(out.preflightSite.acao, 'https://wwm-web.vercel.app');
    assert.equal(out.preflightSite.credentials, 'true');
    assert.equal(out.loginForeign.status, 403);
    assert.equal(out.loginForeign.acao, null);
  });
  test('admin routes stay protected and are never cached', () => {
    assert.equal(out.adminAnonymous.status, 401);
    assert.equal(out.adminAnonymous.cache, 'no-store');
  });
});

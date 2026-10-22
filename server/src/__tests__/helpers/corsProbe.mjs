// Child-process helper for corsDevelopment.test.js: boots the real app with the
// environment the parent gave it, sends the requests a browser would (preflight
// + real calls) from each origin in PROBE_ORIGINS, and prints one JSON line.
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { createApp } = await import(pathToFileURL(path.join(root, 'app.js')).href);
const { env } = await import(pathToFileURL(path.join(root, 'config/env.js')).href);

const server = http.createServer(createApp());
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const h = (res, name) => res.headers.get(name);

const results = {};
for (const origin of JSON.parse(process.env.PROBE_ORIGINS)) {
  const preflight = await fetch(`${base}/api/auth/login`, {
    method: 'OPTIONS',
    headers: { origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' },
  });
  const me = await fetch(`${base}/api/auth/me`, { headers: { origin } });
  const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{}' });
  results[origin] = {
    preflight: { status: preflight.status, acao: h(preflight, 'access-control-allow-origin'), credentials: h(preflight, 'access-control-allow-credentials'), methods: h(preflight, 'access-control-allow-methods'), headers: h(preflight, 'access-control-allow-headers'), vary: h(preflight, 'vary') },
    me: { status: me.status, acao: h(me, 'access-control-allow-origin'), credentials: h(me, 'access-control-allow-credentials') },
    login: { status: login.status, acao: h(login, 'access-control-allow-origin') },
  };
}
console.log('RESULT ' + JSON.stringify({ allowlist: env.clientOrigins, results }));
server.close();

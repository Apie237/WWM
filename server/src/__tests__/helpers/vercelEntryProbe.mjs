// Child-process helper for deploymentConfig.test.js: loads the REAL Vercel entry
// (server/api/index.js) and calls it the way @vercel/node does, with whatever
// production-style environment the parent supplied (database unreachable).
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { default: handler } = await import(pathToFileURL(path.join(serverRoot, 'api/index.js')).href);
const { env } = await import(pathToFileURL(path.join(serverRoot, 'src/config/env.js')).href);

const server = http.createServer((req, res) => handler(req, res));
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const site = env.clientOrigins[0];
const out = { trustProxy: env.trustProxy, nodeEnv: env.nodeEnv };
const call = async (label, p, init = {}) => {
  const r = await fetch(base + p, init);
  out[label] = { status: r.status, acao: r.headers.get('access-control-allow-origin'), credentials: r.headers.get('access-control-allow-credentials'), cache: r.headers.get('cache-control'), body: (await r.text()).slice(0, 200) };
};
await call('health', '/api/health');
await call('preflightSite', '/api/auth/login', { method: 'OPTIONS', headers: { origin: site, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } });
await call('loginForeign', '/api/auth/login', { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}' });
await call('adminAnonymous', '/api/admin/history', { headers: { origin: site } });
console.log('RESULT ' + JSON.stringify(out));
server.close();
process.exit(0);

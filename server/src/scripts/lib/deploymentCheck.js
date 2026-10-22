// Read-only helpers for comparing a DEPLOYED API with the database this machine
// is connected to. Used by scripts/checkDeployment.js. It only ever sends
// unauthenticated GET requests to public endpoints — never a login attempt, so
// it cannot trip the login rate limit — and it never prints or returns a
// password, hash, token or connection string.

// "https://host", "https://host/", or "https://host/api" -> "https://host/api".
export function normalizeApiBase(input) {
  let url;
  try {
    url = new URL(String(input));
  } catch {
    throw new Error('--api must be a full URL such as https://your-api.vercel.app');
  }
  if (url.protocol !== 'https:') throw new Error('--api must be an https:// URL.');
  if (url.username || url.password) throw new Error('--api must not contain credentials.');
  return `${url.origin}/api`;
}

async function get(fetchImpl, base, path) {
  try {
    const res = await fetchImpl(`${base}${path}`, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(20000) });
    let body = null;
    try { body = await res.json(); } catch { /* not JSON */ }
    return { status: res.status, cache: res.headers.get('cache-control'), body };
  } catch (err) {
    return { status: 0, error: err.name === 'TimeoutError' ? 'timed out' : 'network error', body: null };
  }
}

// What the deployed API answers, from public GETs only.
export async function probeDeployment(apiBase, fetchImpl = fetch) {
  const [health, ready, history, me, queryGuard] = await Promise.all([
    get(fetchImpl, apiBase, '/health'),
    get(fetchImpl, apiBase, '/health/ready'),
    get(fetchImpl, apiBase, '/history?limit=200'),
    get(fetchImpl, apiBase, '/auth/me'),
    get(fetchImpl, apiBase, '/health?a=1&a=2'),
  ]);
  const ids = Array.isArray(history.body?.data) ? history.body.data.map((e) => String(e._id)).filter(Boolean) : [];
  return { health, ready, history: { ...history, ids, total: history.body?.pagination?.total ?? null }, me, queryGuard };
}

// Which features the deployed code has. This tells you whether the deployment is
// older than a given change; it cannot name the exact commit (read that from the
// Vercel dashboard: Deployments -> Production -> commit).
export function describeDeployment(p) {
  const lines = [];
  if (p.health.status === 0) {
    lines.push(`Could not reach the API (${p.health.error}). Check the address.`);
    return lines;
  }
  lines.push(`/api/health: HTTP ${p.health.status}${p.health.body?.db ? `, database "${p.health.body.db}"` : ''}`);
  lines.push(
    p.ready.status === 404
      ? '/api/health/ready: 404 -> deployment is OLDER than Phase 10 (no readiness endpoint).'
      : `/api/health/ready: HTTP ${p.ready.status} (${p.ready.status === 200 ? 'connected to a database' : 'NOT connected to a database'}) -> Phase 10 or later.`
  );
  lines.push(
    p.history.status === 404
      ? '/api/history: 404 -> deployment is OLDER than the History feature.'
      : `/api/history: HTTP ${p.history.status}, ${p.history.total ?? '?'} published entries.`
  );
  lines.push(
    p.queryGuard.status === 400
      ? 'Repeated-query guard: present (Phase 10 or later).'
      : `Repeated-query guard: absent (HTTP ${p.queryGuard.status}) -> deployment is OLDER than Phase 10.`
  );
  lines.push(
    p.me.status === 401 && /no-store/i.test(p.me.cache || '')
      ? '/api/auth/me: 401 with no-store (Phase 10 or later).'
      : `/api/auth/me: HTTP ${p.me.status}, cache-control "${p.me.cache ?? 'none'}" -> not the Phase 10 behaviour.`
  );
  lines.push('Later changes (for example the CORS origin parsing) cannot be detected from outside; compare the commit in the Vercel dashboard with GitHub main.');
  return lines;
}

// Are the deployed API's published History entries the same documents as the ones
// in the database this machine reached? ObjectIds are unique, so identical ids
// mean the same database (and the same cluster), not merely a similar one.
export function compareIds(remoteIds, localIds) {
  const local = new Set(localIds.map(String));
  const matching = remoteIds.filter((id) => local.has(String(id))).length;
  let verdict;
  if (!remoteIds.length) verdict = 'UNKNOWN: the deployed API returned no History entries to compare.';
  else if (matching === remoteIds.length) verdict = 'SAME DATABASE: every History entry the deployed API returns exists in the database this machine is connected to.';
  else if (matching === 0) verdict = 'DIFFERENT DATABASE: none of the deployed API\'s History entries exist in the database this machine is connected to. The deployed MONGODB_URI points somewhere else.';
  else verdict = `PARTIAL OVERLAP (${matching} of ${remoteIds.length}): the two databases share some documents (a copy, or edits since). Treat them as different until proven otherwise.`;
  return { remote: remoteIds.length, local: localIds.length, matching, verdict };
}

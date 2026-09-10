// Vercel serverless entry point. `server/src/index.js` remains the entry
// point for local/traditional Node hosting (npm run dev / start) and is
// unchanged — this file adapts the same Express app (createApp()) to
// Vercel's request/response model instead of duplicating its routes,
// middleware, or startup logic.
//
// A warm serverless instance can be reused across invocations, so DB
// connection happens lazily on first request rather than at module load —
// connectDB() is idempotent (see src/config/db.js) and safe to call on every
// request. If it fails, the request still proceeds (matching src/index.js's
// existing local-dev behavior of starting the server even when MongoDB is
// unreachable); individual routes that need the DB will surface their own
// error via the existing error handler.
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

const app = createApp();

app.use((req, res, next) => {
  connectDB()
    .catch((err) => console.error('[db] connection failed:', err.message))
    .finally(next);
});

export default app;

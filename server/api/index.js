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
//
// This must run *before* createApp()'s routes/error handlers, not as
// `app.use()` after the fact: createApp() already terminates its middleware
// stack with a catch-all `notFound` handler and `errorHandler`, so any
// middleware appended afterward would never be reached by a real request.
// Wrapping the whole app as a plain (req, res) handler — which is all
// @vercel/node requires — connects first, then delegates to the app.
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

const app = createApp();

export default function handler(req, res) {
  connectDB()
    .catch((err) => console.error('[db] connection failed:', err.message))
    .finally(() => app(req, res));
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import healthRouter from './routes/health.js';
import continentsRouter from './routes/continents.js';
import countriesRouter from './routes/countries.js';
import organizationsRouter from './routes/organizations.js';
import peopleRouter from './routes/people.js';
import ministriesRouter from './routes/ministries.js';
import newsRouter from './routes/news.js';
import eventsRouter from './routes/events.js';
import resourcesRouter from './routes/resources.js';
import prayerRequestsRouter from './routes/prayerRequests.js';
import contactRouter from './routes/contact.js';
import historyRouter from './routes/history.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { rejectNonStringQuery, requireTrustedOrigin, noStore } from './middleware/security.js';

export function createApp() {
  const app = express();

  // Real client IP behind a reverse proxy (needed by the rate limiters).
  app.set('trust proxy', env.trustProxy);
  // No nested-object query syntax: `?a[$ne]=x` stays a harmless literal key.
  app.set('query parser', 'simple');

  app.use(helmet());
  // `credentials: true` is required for the browser to send/accept the
  // httpOnly admin auth cookie across origins (Phase 6 §6/§18: client and
  // server are separate deployments). This has no effect on the public,
  // unauthenticated routes below, which never read cookies.
  app.use(
    cors({
      // Explicit allowlist only. Requests without an Origin header (curl,
      // server-to-server) are not CORS requests and pass through untouched.
      origin(origin, callback) {
        callback(null, !origin || env.clientOrigins.includes(origin) ? origin || true : false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api', rejectNonStringQuery);
  app.use('/api/auth', noStore, requireTrustedOrigin);
  app.use('/api/admin', noStore, requireTrustedOrigin);
  app.use('/api/history', historyRouter);

  app.use('/api', healthRouter);
  app.use('/api/continents', continentsRouter);
  app.use('/api/countries', countriesRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/people', peopleRouter);
  app.use('/api/ministries', ministriesRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/resources', resourcesRouter);
  app.use('/api/prayer-requests', prayerRequestsRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

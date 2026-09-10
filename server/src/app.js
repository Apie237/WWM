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
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  // `credentials: true` is required for the browser to send/accept the
  // httpOnly admin auth cookie across origins (Phase 6 §6/§18: client and
  // server are separate deployments). This has no effect on the public,
  // unauthenticated routes below, which never read cookies.
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api', healthRouter);
  app.use('/api/continents', continentsRouter);
  app.use('/api/countries', countriesRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/people', peopleRouter);
  app.use('/api/ministries', ministriesRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

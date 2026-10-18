import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

const RETRY_MS = 5000;
let shuttingDown = false;

// If MongoDB is unreachable at boot the server still starts (public pages
// and /api/health stay up; data routes answer 503) and keeps retrying in the
// background until it connects — Mongoose does not retry a failed *initial*
// connection on its own.
async function connectWithRetry() {
  while (!shuttingDown) {
    try {
      await connectDB();
      return;
    } catch (err) {
      console.error(`[db] connection failed (${err.name}); retrying in ${RETRY_MS / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }
}

function start() {
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
  });

  server.on('error', (err) => {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  });

  connectWithRetry();

  // Stop accepting requests, let in-flight ones finish, close the database,
  // and force-exit if that takes too long.
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[server] ${signal} received, shutting down`);
    const force = setTimeout(() => process.exit(1), 10000);
    force.unref();
    server.close(async () => {
      try {
        await disconnectDB();
      } finally {
        process.exit(0);
      }
    });
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandled rejection:', reason instanceof Error ? reason.message : reason);
});

start();

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[db] connection failed, starting server without DB:', err.message);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();

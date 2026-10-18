import mongoose from 'mongoose';
import { env } from './env.js';

let connecting = null;

// Idempotent and safe to call on every request (the Vercel entry point does).
// Concurrent callers share one in-flight attempt instead of the later ones
// returning early while a connection is still being established. Timeouts are
// short so a MongoDB outage produces a fast 503 rather than a 10–30 s hang.
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    mongoose.set('strictQuery', true);
    connecting = mongoose
      .connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000, bufferTimeoutMS: 5000 })
      .then(() => {
        console.log(`[db] connected: ${mongoose.connection.name}`);
      })
      .finally(() => {
        connecting = null;
      });
  }
  return connecting;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

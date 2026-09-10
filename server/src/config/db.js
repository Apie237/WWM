import mongoose from 'mongoose';
import { env } from './env.js';

// Idempotent: safe to call on every request. This matters for the Vercel
// serverless entry point (server/api/index.js), which has no single
// long-lived startup phase to call this from once — a warm serverless
// instance can invoke this many times, and readyState 1/2 (already
// connected/connecting) is a no-op rather than a redundant connect attempt.
export async function connectDB() {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
  console.log(`[db] connected: ${mongoose.connection.name}`);
}

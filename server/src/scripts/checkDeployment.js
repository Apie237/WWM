// READ-ONLY comparison of a deployed API with the database this machine reaches.
//
//   npm run check:deployment -- --api https://your-api.vercel.app
//
// Sends only unauthenticated GET requests to public endpoints (never a login
// attempt) and reads — never writes — the local database named by
// server/.env's MONGODB_URI. Prints the local database name and host (never
// credentials), which features the deployed code has, and whether the deployed
// API is reading the SAME database. It never prints a password, hash or token.
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { HistoryEvent, User } from '../models/index.js';
import { normalizeApiBase, probeDeployment, describeDeployment, compareIds } from './lib/deploymentCheck.js';
import { isMain } from './lib/adminTools.js';

async function main() {
  const i = process.argv.indexOf('--api');
  if (i === -1 || !process.argv[i + 1]) throw new Error('Give --api https://your-api.vercel.app');
  const apiBase = normalizeApiBase(process.argv[i + 1]);

  console.log(`[check:deployment] deployed API: ${apiBase}`);
  const probe = await probeDeployment(apiBase);
  describeDeployment(probe).forEach((l) => console.log(`[check:deployment] ${l}`));

  await connectDB();
  console.log(`[check:deployment] local database: "${mongoose.connection.name}" on ${mongoose.connection.host}`);
  const rows = await HistoryEvent.find({ status: 'published' }).select('_id').lean();
  const cmp = compareIds(probe.history.ids, rows.map((r) => String(r._id)));
  console.log(`[check:deployment] History entries: deployed API ${cmp.remote}, this database ${cmp.local} published, ${cmp.matching} identical.`);
  console.log(`[check:deployment] ${cmp.verdict}`);
  console.log(`[check:deployment] Admin accounts in this database: ${await User.countDocuments({})}.`);
  console.log('[check:deployment] Read-only: nothing was changed.');
  await mongoose.disconnect();
}

if (isMain(import.meta.url, 'checkDeployment.js')) {
  main().catch(async (err) => {
    console.error('[check:deployment] failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

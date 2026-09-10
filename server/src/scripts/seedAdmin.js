// Phase 6 admin seed (docs/CLAUDE.md §21). Creates or updates exactly one
// SUPER_ADMIN account from ADMIN_SEED_* environment variables.
//
// This script refuses to run without all three ADMIN_SEED_* variables set —
// it never falls back to a hardcoded default such as
// admin@example.com/password123. Production credentials must be supplied
// through the deployment platform's own environment variable mechanism, not
// committed anywhere in this repository.
//
// Safe to re-run: upserts by email rather than creating duplicate admins.
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/index.js';
import { hashPassword } from '../services/authService.js';

const MIN_PASSWORD_LENGTH = 10;

async function run() {
  const name = process.env.ADMIN_SEED_NAME;
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      '[seed:admin] ADMIN_SEED_NAME, ADMIN_SEED_EMAIL, and ADMIN_SEED_PASSWORD must all be set ' +
        '(see server/.env.example) before running this script. Refusing to create a default administrator account.'
    );
    process.exitCode = 1;
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`[seed:admin] ADMIN_SEED_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exitCode = 1;
    return;
  }

  await connectDB();

  const passwordHash = await hashPassword(password);
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { name, passwordHash, role: 'SUPER_ADMIN', isActive: true, country: null } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  console.log(`[seed:admin] SUPER_ADMIN ready: ${user.email}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed:admin] failed:', err);
  process.exit(1);
});

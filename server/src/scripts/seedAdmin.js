// Phase 6 admin seed (docs/CLAUDE.md §21). CREATES one SUPER_ADMIN account from
// the ADMIN_SEED_* environment variables — and only if no account with that
// email exists yet.
//
// It never overwrites an existing account: not its password, not its role, not
// its active flag. (Earlier versions upserted and silently reset the password
// of any existing account on every run.) To set a new password on an existing
// account use the explicit, confirmed command:
//     npm run admin:reset-password -- --email <email>
//
// The script refuses to run without all three ADMIN_SEED_* variables — it never
// falls back to a hardcoded default. Production credentials must be supplied
// through the deployment platform's own environment variable mechanism, not
// committed anywhere in this repository. It never prints the password.
//
// IMPORTANT: in server/.env, wrap the password in double quotes if it contains
// "#" — dotenv otherwise treats "#..." as a comment and stores a shorter password
// than the one you typed.
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/index.js';
import { hashPassword } from '../services/authService.js';
import { MIN_PASSWORD_LENGTH, normalizeEmail, envValueWarnings, isMain } from './lib/adminTools.js';

// Returns { status: 'created' | 'exists' | 'invalid', ... }. The database
// connection is the caller's job.
export async function seedAdmin({ name, email, password, log = console.log, error = console.error }) {
  if (!name || !email || !password) {
    error(
      '[seed:admin] ADMIN_SEED_NAME, ADMIN_SEED_EMAIL, and ADMIN_SEED_PASSWORD must all be set ' +
        '(see server/.env.example) before running this script. Refusing to create a default administrator account.'
    );
    return { status: 'invalid' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    error(`[seed:admin] ADMIN_SEED_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    return { status: 'invalid' };
  }

  const normalizedEmail = normalizeEmail(email);
  const existsMessage = (u) =>
    `[seed:admin] An account for ${normalizedEmail} already exists (role ${u?.role ?? 'unknown'}, ${u?.isActive === false ? 'DISABLED' : 'active'}). ` +
    'Nothing was changed: this script never overwrites an existing account or its password. ' +
    'To set a new password run: npm run admin:reset-password -- --email <email>';

  const existing = await User.findOne({ email: normalizedEmail }).select('role isActive');
  if (existing) {
    log(existsMessage(existing));
    return { status: 'exists' };
  }

  const passwordHash = await hashPassword(password);
  try {
    await User.create({ name, email: normalizedEmail, passwordHash, role: 'SUPER_ADMIN', isActive: true, country: null });
  } catch (err) {
    if (err?.code === 11000) {
      log(existsMessage(null));
      return { status: 'exists' };
    }
    throw err;
  }
  log(`[seed:admin] SUPER_ADMIN created: ${normalizedEmail}`);
  return { status: 'created' };
}

async function main() {
  envValueWarnings('ADMIN_SEED_PASSWORD').forEach((w) => console.warn(`[seed:admin] WARNING: ${w}`));
  await connectDB();
  // Name and host only — never the connection string or credentials.
  console.log(`[seed:admin] database: "${mongoose.connection.name}" on ${mongoose.connection.host}`);
  const result = await seedAdmin({
    name: process.env.ADMIN_SEED_NAME,
    email: process.env.ADMIN_SEED_EMAIL,
    password: process.env.ADMIN_SEED_PASSWORD,
  });
  if (result.status === 'invalid') process.exitCode = 1;
  await mongoose.disconnect();
}

if (isMain(import.meta.url, 'seedAdmin.js')) {
  main().catch(async (err) => {
    console.error('[seed:admin] failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

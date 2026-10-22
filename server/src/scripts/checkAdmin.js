// READ-ONLY admin login diagnostic. Writes nothing.
//
//   npm run admin:check                          email from ADMIN_SEED_EMAIL
//   npm run admin:check -- --email you@x.org     a specific email
//   npm run admin:check -- --prompt              also test a password you type
//                                                (hidden input; Git Bash: prefix with winpty)
//   ADMIN_CHECK_PASSWORD='...' npm run admin:check   test a password from the environment
//
// It prints which database it reached (name and host only), whether the account
// exists, its role/active state, whether the stored hash is valid, and whether a
// supplied password matches. It never prints a password or a hash.
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/index.js';
import { inspectAccount, describeInspection, envValueWarnings, promptHidden, isMain } from './lib/adminTools.js';

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = argValue('--email') || process.env.ADMIN_SEED_EMAIL;
  if (!email) throw new Error('Give --email <address> or set ADMIN_SEED_EMAIL.');

  let password = process.env.ADMIN_CHECK_PASSWORD;
  if (process.argv.includes('--prompt')) password = await promptHidden('Password to test (not shown): ');

  await connectDB();
  console.log(`[admin:check] database: "${mongoose.connection.name}" on ${mongoose.connection.host}`);
  console.log(`[admin:check] email checked: ${email.trim().toLowerCase()}`);

  const info = await inspectAccount(email, password);
  const total = await User.countDocuments({});
  describeInspection(info, { totalAccounts: total }).forEach((l) => console.log(`[admin:check] ${l}`));

  // When no password was supplied, test the value the seed would have used.
  if (info.found && info.hashOk && !password && process.env.ADMIN_SEED_PASSWORD) {
    const seeded = await inspectAccount(email, process.env.ADMIN_SEED_PASSWORD);
    console.log(`[admin:check] The stored password ${seeded.passwordMatches ? 'matches' : 'does NOT match'} the value currently in ADMIN_SEED_PASSWORD.`);
  }
  for (const name of ['ADMIN_SEED_PASSWORD', 'ADMIN_CHECK_PASSWORD']) {
    envValueWarnings(name).forEach((w) => console.warn(`[admin:check] WARNING: ${w}`));
  }
  console.log('[admin:check] Read-only check: nothing was changed.');
  await mongoose.disconnect();
}

if (isMain(import.meta.url, 'checkAdmin.js')) {
  main().catch(async (err) => {
    console.error('[admin:check] failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

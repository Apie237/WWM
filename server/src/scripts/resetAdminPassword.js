// Explicit, confirmed password reset for ONE existing admin account (local /
// development use). It never runs automatically, never creates an account,
// never refers to any other user, and changes nothing but that account's
// password hash (not the role, the active flag or the country).
//
//   Interactive (recommended; Git Bash on Windows: prefix with winpty):
//     npm run admin:reset-password -- --email you@x.org
//       -> shows the database and account, asks you to type the email to
//          confirm, then asks for the new password twice (not echoed).
//
//   Non-interactive (password from a protected environment variable):
//     ADMIN_RESET_PASSWORD='your new password' npm run admin:reset-password -- --email you@x.org --yes
//       Use single quotes in bash so "#", "$" and "!" are kept literally.
//
// Refuses to run when NODE_ENV=production. The password is never printed or logged.
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import {
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  inspectAccount,
  resetAdminPassword,
  envValueWarnings,
  promptHidden,
  promptLine,
  isMain,
} from './lib/adminTools.js';

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run while NODE_ENV=production.');
  }
  const email = normalizeEmail(argValue('--email'));
  if (!email) throw new Error('Give --email <address> of the existing account to reset.');
  const assumeYes = process.argv.includes('--yes');

  envValueWarnings('ADMIN_RESET_PASSWORD').forEach((w) => console.warn(`[admin:reset] WARNING: ${w}`));

  await connectDB();
  console.log(`[admin:reset] database: "${mongoose.connection.name}" on ${mongoose.connection.host}`);

  const info = await inspectAccount(email);
  if (!info.found) {
    throw new Error(`No account for ${email} exists in this database. Nothing was changed (this command never creates accounts).`);
  }
  console.log(`[admin:reset] account: ${email} — role ${info.role}, ${info.isActive ? 'active' : 'DISABLED'}`);

  let password = process.env.ADMIN_RESET_PASSWORD;
  if (password) {
    if (!assumeYes) throw new Error('A password from ADMIN_RESET_PASSWORD requires --yes to confirm the reset.');
  } else {
    const typed = normalizeEmail(await promptLine(`Type the account email (${email}) to confirm the reset: `));
    if (typed !== email) throw new Error('Confirmation did not match. Nothing was changed.');
    password = await promptHidden(`New password (min ${MIN_PASSWORD_LENGTH} characters, not shown): `);
    const again = await promptHidden('Repeat the new password: ');
    if (password !== again) throw new Error('The two passwords differ. Nothing was changed.');
  }

  await resetAdminPassword({ email, password });
  console.log('[admin:reset] Password changed for this one account. Nothing else was modified.');
  if (!info.isActive) console.log('[admin:reset] NOTE: the account is still DISABLED; it cannot log in until it is re-enabled.');
  await mongoose.disconnect();
}

if (isMain(import.meta.url, 'resetAdminPassword.js')) {
  main().catch(async (err) => {
    console.error('[admin:reset] failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

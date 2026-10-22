// Shared helpers for the admin-account scripts (seed:admin, admin:check,
// admin:reset-password). Nothing here ever prints, logs or returns a password
// or a password hash.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { User } from '../../models/index.js';
import { hashPassword } from '../../services/authService.js';

export const MIN_PASSWORD_LENGTH = 10;

// Same normalisation the login controller applies to the typed email.
export const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

// dotenv treats an unquoted "#" as the start of a comment, so
//   ADMIN_SEED_PASSWORD=MyLongPassword#2026
// is read as "MyLongPassword" — a different (but still valid-looking) password
// from the one the person later types at the login form. Warn about it,
// without ever printing the value.
export function envValueWarnings(name, envPath = path.resolve('.env')) {
  let raw;
  try {
    raw = fs.readFileSync(envPath, 'utf8');
  } catch {
    return [];
  }
  const matches = [...raw.matchAll(new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=(.*)$`, 'gm'))];
  if (!matches.length) return [];
  const value = matches[matches.length - 1][1].trim(); // dotenv: the last definition wins
  const quoted = /^(["'`]).*\1/.test(value);
  if (!quoted && value.includes('#')) {
    return [
      `${name} in .env contains "#" without quotes. dotenv treats everything from "#" onward as a comment, ` +
        'so only the text before it is used as the password. Wrap the whole value in double quotes.',
    ];
  }
  return [];
}

// Read-only look at one account. `password` (optional) is compared with the
// stored hash exactly the way the login service does it. The hash itself is
// never returned.
export async function inspectAccount(email, password) {
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+passwordHash');
  if (!user) return { found: false };
  const hash = user.passwordHash;
  const hashOk = typeof hash === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
  let passwordMatches = null;
  if (typeof password === 'string' && password.length && hashOk) {
    passwordMatches = await bcrypt.compare(password, hash);
  }
  return {
    found: true,
    role: user.role,
    isActive: user.isActive !== false,
    hashOk,
    passwordMatches,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

// Plain-language findings for `admin:check`.
export function describeInspection(info, { totalAccounts } = {}) {
  if (!info.found) {
    return [
      'No account with this email exists in this database.' +
        (totalAccounts !== undefined ? ` (${totalAccounts} admin account(s) exist here.)` : ''),
      'The login form will answer "Invalid email or password." Check the email you type, and that the seed ran against this database.',
    ];
  }
  const lines = [`Account found: role ${info.role}, ${info.isActive ? 'active' : 'DISABLED'}.`];
  lines.push(info.hashOk ? 'Stored password hash: valid bcrypt format.' : 'Stored password hash: NOT a valid bcrypt hash — this account cannot log in until its password is reset.');
  if (!info.isActive) lines.push('A disabled account is refused with "This administrator account has been disabled." (only after the correct password is given).');
  if (info.passwordMatches === true) lines.push('The password you supplied MATCHES the stored hash, so the credentials are correct.');
  if (info.passwordMatches === false) lines.push('The password you supplied does NOT match the stored hash.');
  if (info.passwordMatches === null) lines.push('No password was supplied to test (use --prompt or ADMIN_CHECK_PASSWORD).');
  return lines;
}

// Sets a new password on an EXISTING account and changes nothing else (not the
// role, the active flag, the country or any other user). Never creates an
// account and never runs in production.
export async function resetAdminPassword({ email, password, nodeEnv = process.env.NODE_ENV }) {
  if (nodeEnv === 'production') {
    throw new Error('Refusing to reset a password while NODE_ENV=production.');
  }
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('An email is required.');
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  const user = await User.findOne({ email: normalized }).select('role isActive');
  if (!user) {
    throw new Error('No account with that email exists in this database. Nothing was changed (this command never creates accounts).');
  }
  const passwordHash = await hashPassword(password);
  await User.updateOne({ _id: user._id }, { $set: { passwordHash } });
  return { role: user.role, isActive: user.isActive !== false };
}

// Interactive input. Needs a real terminal; in Git Bash on Windows run the
// command through `winpty` (or supply the password through the environment).
function requireTerminal() {
  if (!process.stdin.isTTY) {
    throw new Error(
      'Interactive input needs a real terminal. In Git Bash on Windows run the command with "winpty" in front, ' +
        'or supply the password through the environment variable instead.'
    );
  }
}

export function promptLine(question) {
  requireTerminal();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

// Typed characters are not echoed.
export function promptHidden(question) {
  requireTerminal();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let muted = false;
  rl._writeToOutput = (text) => { if (!muted) rl.output.write(text); };
  return new Promise((resolve) => {
    process.stdout.write(question);
    muted = true;
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

// "Run only when executed directly" test shared by the scripts.
export function isMain(metaUrl, fileName) {
  return metaUrl === `file://${process.argv[1]}` || Boolean(process.argv[1]?.endsWith(fileName));
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 12;

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// One shared shape for "the authenticated admin" wherever it's returned —
// the login response, GET /api/auth/me, and req.admin (set by the auth
// middleware) all use this, so the frontend never has to handle two
// different admin object shapes for the same data.
export function toAdminSummary(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    country: user.country
      ? {
          id: user.country._id.toString(),
          name: user.country.name,
          slug: user.country.slug,
        }
      : null,
    isActive: user.isActive,
  };
}

export function signAdminToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      country: user.country ? user.country.toString() : null,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function verifyAdminToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// Deliberately returns the same "Invalid email or password." message for a
// nonexistent email and a wrong password, so a login attempt can't be used to
// enumerate registered admin emails. A disabled account gets its own message
// (docs/CLAUDE.md Phase 6 §21/§27 "disabled admins cannot authenticate") —
// this does confirm the email is registered, but only for admin accounts an
// operator has already deliberately deactivated, which is an accepted,
// minor tradeoff for giving a legitimate deactivated admin an honest reason
// they can't sign in.
export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This administrator account has been disabled.');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  user.lastLoginAt = new Date();
  await user.save();
  await user.populate('country', 'name slug');

  const token = signAdminToken(user);
  return { token, admin: toAdminSummary(user) };
}

// Used by the auth middleware on every protected request, and by the
// seed script's lookup path — always re-checks `isActive` here (not just at
// login) so an admin disabled after issuing a token loses access immediately
// on their next request, without needing token revocation/blocklisting.
export async function getActiveAdminById(id) {
  const user = await User.findById(id).populate('country', 'name slug');
  if (!user || !user.isActive) return null;
  return user;
}

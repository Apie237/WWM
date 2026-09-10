import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ADMIN_COOKIE_NAME, adminCookieOptions, adminClearCookieOptions } from '../config/auth.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readLoginCredentials(body = {}) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, 'A valid email address is required.');
  }
  if (!password) {
    throw new ApiError(400, 'Password is required.');
  }
  return { email, password };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = readLoginCredentials(req.body);
  const { token, admin } = await authService.login({ email, password });
  res.cookie(ADMIN_COOKIE_NAME, token, adminCookieOptions());
  res.json({ success: true, data: { admin } });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, adminClearCookieOptions());
  res.json({ success: true, data: { message: 'Logged out.' } });
});

// requireAuth has already attached req.admin by the time this runs.
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { admin: req.admin } });
});

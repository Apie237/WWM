import { ApiError } from './apiError.js';

// Small validators for untrusted public input (prayer/contact forms) and
// admin content fields. All failures are 400 ApiErrors.

export function cleanString(value, field, { required = false, max = 500 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ApiError(400, `"${field}" is required.`);
    return undefined;
  }
  if (typeof value !== 'string') throw new ApiError(400, `"${field}" must be text.`);
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw new ApiError(400, `"${field}" is required.`);
    return undefined;
  }
  if (trimmed.length > max) throw new ApiError(400, `"${field}" must be at most ${max} characters.`);
  return trimmed;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function cleanEmail(value, field = 'email') {
  const email = cleanString(value, field, { required: true, max: 254 });
  if (!EMAIL_RE.test(email)) throw new ApiError(400, `"${field}" must be a valid email address.`);
  return email.toLowerCase();
}

// http(s) only — blocks javascript:/data: URLs from ever being rendered as links.
export function cleanHttpUrl(value, field, { required = false, max = 1000 } = {}) {
  const url = cleanString(value, field, { required, max });
  if (url === undefined) return undefined;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new ApiError(400, `"${field}" must be a valid http(s) URL.`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ApiError(400, `"${field}" must be a valid http(s) URL.`);
  }
  return url;
}

export function cleanDate(value, field, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ApiError(400, `"${field}" is required.`);
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `"${field}" must be a valid date.`);
  return date;
}

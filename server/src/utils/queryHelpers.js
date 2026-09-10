import mongoose from 'mongoose';
import { ApiError } from './apiError.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Malformed pagination values (not a positive integer) are a 400 client
// error rather than a silently-corrected default, per Phase 3 instructions.
// A limit that is merely too large is not "invalid" — it is clamped to
// MAX_LIMIT instead, satisfying "do not allow clients to request unlimited
// records" without rejecting an otherwise well-formed request.
export function parsePagination(query, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  let page = 1;
  let limit = defaultLimit;

  if (query.page !== undefined) {
    const parsed = Number(query.page);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new ApiError(400, 'Invalid "page" query parameter: must be a positive integer.');
    }
    page = parsed;
  }

  if (query.limit !== undefined) {
    const parsed = Number(query.limit);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new ApiError(400, 'Invalid "limit" query parameter: must be a positive integer.');
    }
    limit = Math.min(parsed, maxLimit);
  }

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta({ page, limit, total }) {
  return { page, limit, total, pages: total === 0 ? 0 : Math.ceil(total / limit) };
}

// Restricts `sort` to a per-resource allow-list so callers can't sort on
// arbitrary/internal fields, and validates `order` explicitly rather than
// silently coercing an invalid value.
export function parseSort(query, allowedFields, defaultField) {
  let field = defaultField;
  if (query.sort !== undefined) {
    if (!allowedFields.includes(query.sort)) {
      throw new ApiError(400, `Invalid "sort" query parameter. Allowed values: ${allowedFields.join(', ')}.`);
    }
    field = query.sort;
  }

  let direction = 1;
  if (query.order !== undefined) {
    const normalized = String(query.order).toLowerCase();
    if (normalized === 'desc') direction = -1;
    else if (normalized === 'asc') direction = 1;
    else throw new ApiError(400, 'Invalid "order" query parameter: must be "asc" or "desc".');
  }

  return { [field]: direction };
}

// Stricter than mongoose.Types.ObjectId.isValid alone, which also accepts
// some non-hex-string inputs it can coerce. This avoids ever handing an
// ambiguous value to Mongoose's own (CastError-throwing) ObjectId casting.
export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);
}

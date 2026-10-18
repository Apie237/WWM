import { ApiError } from '../utils/apiError.js';

export function notFound(req, res, next) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

const GENERIC_SERVER_ERROR = 'Something went wrong on our side. Please try again.';
const DB_UNAVAILABLE = 'The service is temporarily unavailable. Please try again shortly.';

// Translates well-known library errors into the project's normal client/
// server statuses so they never fall through as a 500 with internal text.
// Returns { status, message } for errors we recognise, otherwise null.
function translateKnownError(err) {
  // express.json(): malformed JSON / oversized body (also raw image bodies).
  if (err.type === 'entity.parse.failed') return { status: 400, message: 'Malformed JSON in request body.' };
  if (err.type === 'entity.too.large') return { status: 413, message: 'Request body is too large.' };

  // Mongoose schema validation: these messages describe the user's own input.
  if (err.name === 'ValidationError' && err.errors) {
    const detail = Object.values(err.errors).map((e) => e.message).slice(0, 5).join(' ');
    return { status: 400, message: detail || 'Invalid data.' };
  }
  if (err.name === 'CastError') return { status: 400, message: 'Invalid value supplied.' };
  if (err.code === 11000) return { status: 409, message: 'A record with that value already exists.' };

  // MongoDB unreachable / not connected / buffering timed out.
  const dbDown =
    /ServerSelection|MongoNetwork|MongoTopology|MongoNotConnected|MongoPoolClearedError/.test(err.name || '') ||
    /buffering timed out/i.test(err.message || '');
  if (dbDown) return { status: 503, message: DB_UNAVAILABLE };

  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const known = translateKnownError(err);
  let status = known?.status ?? err.status ?? err.statusCode ?? 500;
  if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;

  // Server-side logging: full detail for 5xx (never request bodies or
  // headers), a single short line for expected 4xx.
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl.split('?')[0]} -> ${status}`, err);
  }

  let message;
  if (known) message = known.message;
  // ApiError messages are written by us for the client (e.g. the 503 "uploads
  // not configured" and 502 "upload failed" notices). Anything else that
  // reaches here as a 5xx is an unexpected internal error: never echo it.
  else if (status >= 500 && !(err instanceof ApiError)) message = GENERIC_SERVER_ERROR;
  else message = err.message || 'Request failed.';

  res.status(status).json({ error: message });
}

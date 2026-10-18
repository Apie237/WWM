import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { cleanHttpUrl } from '../utils/inputValidation.js';
import { News, Event, Person, Country, HistoryEvent } from '../models/index.js';

// Phase 9 media service: validated image uploads to Cloudinary plus the
// ownership/reference rules around attaching and releasing assets.
//
// Design (docs/PROGRESS.md "Phase 9"):
//  - No Cloudinary SDK: uploads/destroys call Cloudinary's documented signed
//    REST API with Node's built-in fetch/crypto, so there is no new
//    dependency or lockfile change. The signature routine is unit-tested
//    against Cloudinary's published example.
//  - No Media model: each owning record stores its asset's public id next to
//    its existing URL field. "Is this asset still used?" is a lookup across
//    the four owning collections (MEDIA_TARGETS).
//  - Clients never supply URLs or arbitrary ids for storage: the server only
//    accepts ids matching wwm/<kind>/<32 hex>, rebuilds the URL itself, and
//    refuses an id already used by another record.
//  - Cloudinary assets are destroyed only after a database write succeeded
//    AND a reference check found no remaining user. There is no public
//    "delete by id" endpoint.
//  - The API secret is only ever used to sign requests here. It is never
//    returned, logged, or included in an error message.

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const CLOUDINARY_ALLOWED_FORMATS = 'jpg,png,webp';

// kind → owning model + the field that stores the asset id.
export const MEDIA_TARGETS = {
  news: { Model: News, idField: 'imagePublicId' },
  events: { Model: Event, idField: 'imagePublicId' },
  people: { Model: Person, idField: 'photoPublicId' },
  countries: { Model: Country, idField: 'flagImagePublicId' },
  history: { Model: HistoryEvent, idField: 'imagePublicId' },
};
export const MEDIA_KINDS = Object.keys(MEDIA_TARGETS);

const PUBLIC_ID_RE = /^wwm\/(news|events|people|countries|history)\/[a-f0-9]{32}$/;

export function isMediaConfigured() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  return Boolean(cloudName && apiKey && apiSecret);
}

export function assertMediaConfigured() {
  if (!isMediaConfigured()) {
    throw new ApiError(
      503,
      'Image uploads are not configured on this server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
    );
  }
}

// Safe to send to the browser: contains no credentials.
export function getPublicMediaConfig() {
  return {
    enabled: isMediaConfigured(),
    maxBytes: env.mediaMaxUploadBytes,
    allowedTypes: ALLOWED_IMAGE_MIME,
  };
}

// Cloudinary signature: SHA-1 of the sorted "key=value" pairs joined with "&",
// with the API secret appended. (file, api_key, resource_type, cloud_name are
// never signed.)
export function signParams(params, apiSecret) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

// Identifies the real image type from the file's leading bytes, ignoring the
// filename and the browser-declared MIME type. Returns a MIME string or null.
export function sniffImageMime(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

export function isValidPublicId(publicId, kind) {
  if (typeof publicId !== 'string') return false;
  const m = PUBLIC_ID_RE.exec(publicId);
  return Boolean(m) && (kind === undefined || m[1] === kind);
}

// f_auto,q_auto lets Cloudinary pick the best format/quality per browser.
export function buildImageUrl(publicId) {
  assertMediaConfigured();
  return `https://res.cloudinary.com/${env.cloudinary.cloudName}/image/upload/f_auto,q_auto/${publicId}`;
}

function logUpstream(action, status, message) {
  // Server log only: status plus a short upstream message (Cloudinary never
  // echoes the API secret). Request bodies/credentials are never logged.
  console.warn(`[media] Cloudinary ${action} failed (HTTP ${status})${message ? `: ${String(message).slice(0, 200)}` : ''}`);
}

export async function uploadImage({ buffer, kind, mime }) {
  assertMediaConfigured();
  if (!MEDIA_TARGETS[kind]) throw new ApiError(400, 'Unknown upload type.');
  const { cloudName, apiKey, apiSecret } = env.cloudinary;

  const name = crypto.randomBytes(16).toString('hex');
  const params = {
    allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
    folder: `wwm/${kind}`,
    public_id: name,
    timestamp: Math.floor(Date.now() / 1000),
  };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, String(v));
  form.append('api_key', apiKey);
  form.append('signature', signParams(params, apiSecret));
  form.append('file', new Blob([buffer], { type: mime }), 'upload');

  let res;
  let body = null;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30000),
    });
    body = await res.json().catch(() => null);
  } catch (err) {
    logUpstream('upload', 'network', err?.name);
    throw new ApiError(502, 'The image service could not be reached. Please try again.');
  }

  const expectedId = `wwm/${kind}/${name}`;
  if (!res.ok || !body || body.public_id !== expectedId) {
    logUpstream('upload', res.status, body?.error?.message);
    throw new ApiError(502, 'The image could not be uploaded. Please try again or contact an administrator.');
  }
  return {
    publicId: body.public_id,
    url: buildImageUrl(body.public_id),
    format: body.format,
    width: body.width,
    height: body.height,
    bytes: body.bytes,
  };
}

async function destroyAsset(publicId) {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  const params = { invalidate: 'true', public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
  const body = new URLSearchParams({ ...params, api_key: apiKey, signature: signParams(params, apiSecret) });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(20000),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    logUpstream('destroy', res.status, json?.error?.message);
    return false;
  }
  return true;
}

// True if any record still references this asset id. Used both to refuse
// attaching an asset that belongs to someone else and to block deleting one
// that is still in use.
export async function isAssetReferenced(publicId) {
  for (const { Model, idField } of Object.values(MEDIA_TARGETS)) {
    if (await Model.exists({ [idField]: publicId })) return true;
  }
  return false;
}

// Best-effort cleanup AFTER a successful database write. Never throws and
// never deletes an asset that is invalid-looking, unconfigured, or still
// referenced. An orphan left by a failed destroy is harmless; deleting an
// in-use image is not.
export async function releaseAssetIfUnreferenced(publicId) {
  try {
    if (!publicId || !isValidPublicId(publicId) || !isMediaConfigured()) return false;
    if (await isAssetReferenced(publicId)) return false;
    return await destroyAsset(publicId);
  } catch (err) {
    logUpstream('cleanup', 'error', err?.message);
    return false;
  }
}

// Validates and normalizes one image field inside a write payload (`data` is
// the already-whitelisted payload; it is mutated). Rules:
//  - `idField` set  → must be a well-formed id for this kind, and must not
//    already belong to another record; the URL is rebuilt server-side and any
//    client-supplied URL is ignored.
//  - `idField` empty/null → the managed image is removed; a legacy http(s)
//    `urlField` may still be provided and is kept as-is (validated); if no
//    URL is sent the URL is cleared too.
//  - only `urlField` sent → legacy external URL write (validated http(s)),
//    except that re-sending the unchanged URL of a managed image changes nothing.
// Returns { previousId, nextId } so the caller can release the replaced asset
// after saving.
export async function prepareImageField(data, existing, { urlField, idField, kind }) {
  const previousId = existing?.[idField] || null;
  const hasId = idField in data;
  const hasUrl = urlField in data;
  if (!hasId && !hasUrl) return { previousId, nextId: previousId };

  const rawId = hasId ? data[idField] : undefined;

  if (typeof rawId === 'string' && rawId.trim()) {
    const nextId = rawId.trim();
    if (!isValidPublicId(nextId, kind)) {
      throw new ApiError(400, `"${idField}" is not a valid ${kind} image reference.`);
    }
    if (nextId !== previousId && (await isAssetReferenced(nextId))) {
      throw new ApiError(409, 'This image is already in use by another record and cannot be attached here.');
    }
    data[idField] = nextId;
    data[urlField] = buildImageUrl(nextId);
    return { previousId, nextId };
  }

  if (hasId && rawId !== null && rawId !== undefined && rawId !== '') {
    throw new ApiError(400, `"${idField}" must be text or empty.`);
  }

  if (!hasId && previousId && data[urlField] === existing[urlField]) {
    delete data[urlField];
    return { previousId, nextId: previousId };
  }

  data[idField] = undefined;
  // A URL that is unchanged from what is already stored is kept as-is, so
  // editing a record never fails because of a value saved before Phase 9.
  const unchanged = hasUrl && existing && data[urlField] === existing[urlField];
  data[urlField] = hasUrl ? (unchanged ? data[urlField] : cleanHttpUrl(data[urlField], urlField, { max: 500 })) : undefined;
  return { previousId, nextId: null };
}

export async function releaseReplacedImage({ previousId, nextId }) {
  if (previousId && previousId !== nextId) await releaseAssetIfUnreferenced(previousId);
}

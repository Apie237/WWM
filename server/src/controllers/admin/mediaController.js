import * as mediaService from '../../services/mediaService.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';

// Which roles may upload for which kind — the same roles that may WRITE the
// owning module (news/events/people: all four; countries: not CONTENT_EDITOR).
// Uploading alone changes no record; country scoping is enforced when an
// image is attached, by the owning module's existing controller/service.
const ALL_WRITERS = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'];
export const UPLOAD_ROLES = {
  news: ALL_WRITERS,
  events: ALL_WRITERS,
  people: ALL_WRITERS,
  countries: ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN'],
};

export const getMediaConfig = asyncHandler(async (req, res) => {
  res.json({ success: true, data: mediaService.getPublicMediaConfig() });
});

// Runs BEFORE the body is read, so an unauthorized or unconfigured request
// never makes the server buffer megabytes.
export function authorizeUpload(req, res, next) {
  const kind = req.params.kind;
  if (!mediaService.MEDIA_KINDS.includes(kind)) return next(new ApiError(404, 'Unknown upload type.'));
  if (!UPLOAD_ROLES[kind].includes(req.admin.role)) {
    return next(new ApiError(403, 'You do not have permission to upload this kind of image.'));
  }
  try {
    mediaService.assertMediaConfigured();
  } catch (err) {
    return next(err);
  }
  next();
}

export const uploadImage = asyncHandler(async (req, res) => {
  const buffer = req.body;
  if (!Buffer.isBuffer(buffer)) {
    throw new ApiError(415, 'Unsupported file type. Upload a JPEG, PNG, or WebP image.');
  }
  if (buffer.length === 0) throw new ApiError(400, 'The uploaded file is empty.');

  // Trust the bytes, not the label: the real type must be an allowed image
  // AND agree with the declared Content-Type.
  const sniffed = mediaService.sniffImageMime(buffer);
  if (!sniffed) throw new ApiError(400, 'This file is not a valid JPEG, PNG, or WebP image.');
  const declared = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (declared !== sniffed) throw new ApiError(400, 'The file contents do not match its declared image type.');

  const data = await mediaService.uploadImage({ buffer, kind: req.params.kind, mime: sniffed });
  res.status(201).json({ success: true, data });
});

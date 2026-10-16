import { PrayerRequest } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { cleanString } from '../../utils/inputValidation.js';
import { PRAYER_REQUEST_STATUSES } from '../../models/enums.js';
import { makeContentAdminService } from './contentAdminService.js';

// Moderators may change only the status and a private note — never the
// submitted text, name, or country.
export const PRAYER_WRITABLE_FIELDS = ['status', 'moderationNote'];

export async function validatePrayerModeration(data) {
  const out = { ...data };
  if ('status' in data && !PRAYER_REQUEST_STATUSES.includes(data.status)) {
    throw new ApiError(400, `"status" must be one of: ${PRAYER_REQUEST_STATUSES.join(', ')}.`);
  }
  if ('moderationNote' in data) out.moderationNote = cleanString(data.moderationNote, 'moderationNote', { max: 500 });
  return out;
}

export const prayerRequestAdminService = makeContentAdminService({
  Model: PrayerRequest,
  label: 'Prayer request',
  writableFields: PRAYER_WRITABLE_FIELDS,
  populate: [{ path: 'country', select: 'name slug' }],
  validate: validatePrayerModeration,
});

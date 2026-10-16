import { Event } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { cleanString, cleanHttpUrl, cleanDate } from '../../utils/inputValidation.js';
import { CONTENT_STATUSES } from '../../models/enums.js';
import { makeContentAdminService } from './contentAdminService.js';
import { assertCountryExists } from './newsAdminService.js';

export const EVENT_WRITABLE_FIELDS = ['title', 'slug', 'description', 'country', 'location', 'startDate', 'endDate', 'imageUrl', 'status', 'notes'];

export async function validateEvent(data, { existing }) {
  const out = { ...data };
  if ('title' in data || !existing) out.title = cleanString(data.title, 'title', { required: true, max: 200 });
  if ('slug' in data) out.slug = cleanString(data.slug, 'slug', { max: 220 });
  if ('description' in data) out.description = cleanString(data.description, 'description', { max: 10000 });
  if ('location' in data) out.location = cleanString(data.location, 'location', { max: 300 });
  if ('imageUrl' in data) out.imageUrl = cleanHttpUrl(data.imageUrl, 'imageUrl', { max: 500 });
  if ('notes' in data) out.notes = cleanString(data.notes, 'notes', { max: 1000 });
  if ('status' in data && !CONTENT_STATUSES.includes(data.status)) {
    throw new ApiError(400, `"status" must be one of: ${CONTENT_STATUSES.join(', ')}.`);
  }
  if ('startDate' in data || !existing) out.startDate = cleanDate(data.startDate, 'startDate', { required: true });
  if ('endDate' in data) out.endDate = cleanDate(data.endDate, 'endDate');

  // End must not precede start — checked against the effective values so a
  // PATCH of only one of the two dates is still validated.
  const start = out.startDate ?? existing?.startDate;
  const end = 'endDate' in data ? out.endDate : existing?.endDate;
  if (start && end && new Date(end) < new Date(start)) {
    throw new ApiError(400, '"endDate" must not be before "startDate".');
  }

  if ('country' in data && data.country) await assertCountryExists(data.country);
  if ('country' in data && !data.country) out.country = undefined;
  return out;
}

export const eventAdminService = makeContentAdminService({
  Model: Event,
  label: 'Event',
  writableFields: EVENT_WRITABLE_FIELDS,
  populate: [{ path: 'country', select: 'name slug' }],
  validate: validateEvent,
});

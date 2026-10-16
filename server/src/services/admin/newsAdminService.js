import { News, Country } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { requireObjectIdField } from '../../utils/adminHelpers.js';
import { cleanString, cleanHttpUrl, cleanDate } from '../../utils/inputValidation.js';
import { CONTENT_STATUSES } from '../../models/enums.js';
import { makeContentAdminService } from './contentAdminService.js';

export const NEWS_WRITABLE_FIELDS = ['title', 'slug', 'summary', 'body', 'country', 'imageUrl', 'status', 'publishedAt', 'notes'];

export async function assertCountryExists(countryId) {
  requireObjectIdField(countryId, 'country');
  if (!(await Country.exists({ _id: countryId }))) throw new ApiError(400, `Referenced country does not exist: ${countryId}`);
}

// Only fields actually present in `data` are validated/returned, so a PATCH
// of one field never wipes the others.
export async function validateNews(data, { existing }) {
  const out = { ...data };
  if ('title' in data || !existing) out.title = cleanString(data.title, 'title', { required: true, max: 200 });
  if ('slug' in data) out.slug = cleanString(data.slug, 'slug', { max: 220 });
  if ('summary' in data) out.summary = cleanString(data.summary, 'summary', { max: 500 });
  if ('body' in data) out.body = cleanString(data.body, 'body', { max: 20000 });
  if ('imageUrl' in data) out.imageUrl = cleanHttpUrl(data.imageUrl, 'imageUrl', { max: 500 });
  if ('publishedAt' in data) out.publishedAt = cleanDate(data.publishedAt, 'publishedAt');
  if ('notes' in data) out.notes = cleanString(data.notes, 'notes', { max: 1000 });
  if ('status' in data && !CONTENT_STATUSES.includes(data.status)) {
    throw new ApiError(400, `"status" must be one of: ${CONTENT_STATUSES.join(', ')}.`);
  }
  if ('country' in data && data.country) await assertCountryExists(data.country);
  if ('country' in data && !data.country) out.country = undefined;
  return out;
}

export const newsAdminService = makeContentAdminService({
  Model: News,
  label: 'News article',
  writableFields: NEWS_WRITABLE_FIELDS,
  populate: [{ path: 'country', select: 'name slug' }],
  validate: validateNews,
});

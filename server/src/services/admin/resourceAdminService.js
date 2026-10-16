import { Resource } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { cleanString, cleanHttpUrl, cleanDate } from '../../utils/inputValidation.js';
import { CONTENT_STATUSES, RESOURCE_TYPES } from '../../models/enums.js';
import { makeContentAdminService } from './contentAdminService.js';

export const RESOURCE_WRITABLE_FIELDS = ['title', 'slug', 'description', 'resourceType', 'url', 'status', 'publishedAt', 'order', 'notes'];

export async function validateResource(data, { existing }) {
  const out = { ...data };
  if ('title' in data || !existing) out.title = cleanString(data.title, 'title', { required: true, max: 200 });
  if ('slug' in data) out.slug = cleanString(data.slug, 'slug', { max: 220 });
  if ('description' in data) out.description = cleanString(data.description, 'description', { max: 2000 });
  if ('url' in data || !existing) out.url = cleanHttpUrl(data.url, 'url', { required: true });
  if ('publishedAt' in data) out.publishedAt = cleanDate(data.publishedAt, 'publishedAt');
  if ('notes' in data) out.notes = cleanString(data.notes, 'notes', { max: 1000 });
  if ('resourceType' in data && !RESOURCE_TYPES.includes(data.resourceType)) {
    throw new ApiError(400, `"resourceType" must be one of: ${RESOURCE_TYPES.join(', ')}.`);
  }
  if ('status' in data && !CONTENT_STATUSES.includes(data.status)) {
    throw new ApiError(400, `"status" must be one of: ${CONTENT_STATUSES.join(', ')}.`);
  }
  if ('order' in data) {
    const n = Number(data.order);
    if (!Number.isFinite(n)) throw new ApiError(400, '"order" must be a number.');
    out.order = n;
  }
  return out;
}

export const resourceAdminService = makeContentAdminService({
  Model: Resource,
  label: 'Resource',
  writableFields: RESOURCE_WRITABLE_FIELDS,
  validate: validateResource,
});

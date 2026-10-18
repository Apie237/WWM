import { HistoryEvent, Person, Country } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { requireObjectIdField, requireValidObjectIdListField } from '../../utils/adminHelpers.js';
import { cleanString } from '../../utils/inputValidation.js';
import { CONTENT_STATUSES, HISTORY_SECTIONS, HISTORY_ENTRY_TYPES, HISTORY_REVIEW_STATUSES } from '../../models/enums.js';
import { makeContentAdminService } from './contentAdminService.js';

// `key` is deliberately not writable: it exists only for the seed script.
export const HISTORY_WRITABLE_FIELDS = [
  'section', 'entryType', 'title', 'subtitle', 'description', 'year', 'dateLabel', 'approximateDate', 'historical',
  'location', 'people', 'country', 'source', 'imageUrl', 'imagePublicId', 'imageAlt', 'imageCaption', 'order',
  'status', 'reviewStatus', 'reviewNote', 'notes',
];

function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) throw new ApiError(400, `"${field}" must be one of: ${allowed.join(', ')}.`);
  return value;
}

function bool(value, field) {
  if (typeof value !== 'boolean') throw new ApiError(400, `"${field}" must be true or false.`);
  return value;
}

export async function validateHistory(data, { existing }) {
  const out = { ...data };
  if ('section' in data || !existing) out.section = oneOf(data.section, HISTORY_SECTIONS, 'section');
  if ('entryType' in data) out.entryType = oneOf(data.entryType, HISTORY_ENTRY_TYPES, 'entryType');
  if ('status' in data) out.status = oneOf(data.status, CONTENT_STATUSES, 'status');
  if ('reviewStatus' in data) out.reviewStatus = oneOf(data.reviewStatus, HISTORY_REVIEW_STATUSES, 'reviewStatus');
  if ('title' in data || !existing) out.title = cleanString(data.title, 'title', { required: true, max: 200 });
  for (const [field, max] of [['subtitle', 200], ['description', 5000], ['dateLabel', 80], ['location', 200], ['source', 500], ['imageAlt', 300], ['imageCaption', 300], ['reviewNote', 1000], ['notes', 1000]]) {
    if (field in data) out[field] = cleanString(data[field], field, { max });
  }
  // Image URLs are only ever produced by the Phase 9 media helper or kept as
  // validated legacy http(s) links there (see mediaService.prepareImageField).
  if ('approximateDate' in data) out.approximateDate = bool(data.approximateDate, 'approximateDate');
  if ('historical' in data) out.historical = bool(data.historical, 'historical');
  if ('year' in data) {
    if (data.year === '' || data.year === null) out.year = undefined;
    else {
      const n = Number(data.year);
      if (!Number.isInteger(n) || n < 0 || n > 2200) throw new ApiError(400, '"year" must be a whole number between 0 and 2200.');
      out.year = n;
    }
  }
  if ('order' in data) {
    const n = Number(data.order);
    if (!Number.isFinite(n)) throw new ApiError(400, '"order" must be a number.');
    out.order = n;
  }
  if ('people' in data) {
    if (!Array.isArray(data.people)) throw new ApiError(400, '"people" must be a list of person ids.');
    if (data.people.length > 20) throw new ApiError(400, '"people" may list at most 20 people.');
    requireValidObjectIdListField(data.people, 'people');
    const ids = [...new Set(data.people.filter(Boolean).map(String))];
    const found = ids.length ? await Person.countDocuments({ _id: { $in: ids } }) : 0;
    if (found !== ids.length) throw new ApiError(400, 'One or more referenced people do not exist.');
    out.people = ids;
  }
  if ('country' in data) {
    if (data.country) {
      requireObjectIdField(data.country, 'country');
      if (!(await Country.exists({ _id: data.country }))) throw new ApiError(400, `Referenced country does not exist: ${data.country}`);
    } else {
      out.country = undefined;
    }
  }
  return out;
}

export const historyAdminService = makeContentAdminService({
  Model: HistoryEvent,
  label: 'History entry',
  writableFields: HISTORY_WRITABLE_FIELDS,
  populate: [{ path: 'people', select: 'displayName photoUrl' }, { path: 'country', select: 'name slug' }],
  validate: validateHistory,
  media: { urlField: 'imageUrl', idField: 'imagePublicId', kind: 'history' },
});

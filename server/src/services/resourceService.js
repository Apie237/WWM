import { Resource } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { RESOURCE_TYPES } from '../models/enums.js';

const PUBLIC_PROJECTION = '-__v -notes';

export async function listResources({ sort, skip, limit, type }) {
  const filter = { status: 'published' };
  if (type !== undefined) {
    if (!RESOURCE_TYPES.includes(type)) {
      throw new ApiError(400, `Invalid "type" query parameter. Allowed values: ${RESOURCE_TYPES.join(', ')}.`);
    }
    filter.resourceType = type;
  }
  const [items, total] = await Promise.all([
    Resource.find(filter).select(PUBLIC_PROJECTION).sort(sort).skip(skip).limit(limit).lean(),
    Resource.countDocuments(filter),
  ]);
  return { items, total };
}

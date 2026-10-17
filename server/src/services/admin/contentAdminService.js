import { ApiError } from '../../utils/apiError.js';
import { pickAllowed } from '../../utils/adminHelpers.js';
import { prepareImageField, releaseReplacedImage, releaseAssetIfUnreferenced } from '../mediaService.js';

// Phase 8 admin services (News, Events, Resources, Prayer Requests, Contact
// Messages) are structurally identical list/get/create/update/delete over one
// Mongoose model, so they share this one small factory (the same reasoning
// that led Phase 7 to share one page-factory for its two identical
// leadership modules). Each module supplies only its model, writable-field
// whitelist, populate spec, and `validate` hook.
//
// `validate(effective, { existing })` receives the full post-write field
// values (existing document merged with the whitelisted body) and may throw
// ApiError(400); it returns the cleaned values for the whitelisted fields.
// Optional `media` = { urlField, idField, kind } enables Phase 9 image handling
// for that field (see mediaService.prepareImageField).
export function makeContentAdminService({ Model, label, writableFields, populate = [], validate = async (d) => d, media = null }) {
  const withPopulate = (query) => populate.reduce((q, p) => q.populate(p), query);

  return {
    writableFields,

    async list({ sort, skip, limit, filter = {} }) {
      const [items, total] = await Promise.all([
        withPopulate(Model.find(filter).select('-__v')).sort(sort).skip(skip).limit(limit).lean(),
        Model.countDocuments(filter),
      ]);
      return { items, total };
    },

    async get(id) {
      const doc = await withPopulate(Model.findById(id).select('-__v')).lean();
      if (!doc) throw new ApiError(404, `${label} not found: ${id}`);
      return doc;
    },

    async create(body) {
      const picked = pickAllowed(body, writableFields);
      const cleaned = await validate(picked, { existing: null });
      if (media) await prepareImageField(cleaned, null, media);
      const doc = new Model(cleaned);
      await doc.save();
      return doc.toObject();
    },

    async update(id, body) {
      const doc = await Model.findById(id);
      if (!doc) throw new ApiError(404, `${label} not found: ${id}`);
      const picked = pickAllowed(body, writableFields);
      const existing = doc.toObject();
      const cleaned = await validate(picked, { existing });
      const change = media ? await prepareImageField(cleaned, existing, media) : null;
      doc.set(cleaned);
      await doc.save();
      // Only after the save succeeded: release the replaced asset if nothing else uses it.
      if (change) await releaseReplacedImage(change);
      return doc.toObject();
    },

    async remove(id) {
      const doc = await Model.findById(id);
      if (!doc) throw new ApiError(404, `${label} not found: ${id}`);
      const imageId = media ? doc[media.idField] : null;
      await doc.deleteOne();
      if (imageId) await releaseAssetIfUnreferenced(imageId);
    },
  };
}

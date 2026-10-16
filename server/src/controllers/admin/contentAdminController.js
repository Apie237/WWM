import { parsePagination, buildPaginationMeta, parseSort } from '../../utils/queryHelpers.js';
import { requireObjectIdParam, isDuplicateKeyError, duplicateKeyMessage, assertCountryWritable, applySearch } from '../../utils/adminHelpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';

// Shared thin controller for the Phase 8 admin modules. Mirrors the Phase 7
// ministriesController pattern:
//  - `countryScoped` modules: a COUNTRY_ADMIN sees/edits/deletes ONLY records
//    whose `country` equals their own verified-JWT country (records with no
//    country are international and out of their reach), and may only create
//    records for their own country. Identity comes from req.admin, never
//    from the request body.
//  - Other modules apply no country scoping (routes restrict by role).
export function makeContentAdminController(service, { label, countryScoped = false, sortable, defaultSort, defaultOrder = 'asc', searchFields = [], filterFields = [] }) {
  const isCountryAdmin = (req) => req.admin.role === 'COUNTRY_ADMIN';
  const ownsRecord = (req, record) => {
    const countryId = record.country?._id ?? record.country;
    return Boolean(countryId) && String(countryId) === String(req.admin.country?.id);
  };

  async function assertOwn(req, id, verb) {
    if (!countryScoped || !isCountryAdmin(req)) return;
    const existing = await service.get(id);
    if (!ownsRecord(req, existing)) throw new ApiError(403, `You are not authorized to ${verb} this ${label}.`);
  }

  return {
    list: asyncHandler(async (req, res) => {
      const { page, limit, skip } = parsePagination(req.query);
      const sort = parseSort({ order: defaultOrder, ...req.query }, sortable, defaultSort);

      let filter = {};
      if (countryScoped) {
        if (isCountryAdmin(req)) filter.country = req.admin.country?.id;
        else if (req.query.country) filter.country = requireObjectIdParam(req.query.country, 'country');
      }
      for (const field of filterFields) {
        if (req.query[field]) filter[field] = String(req.query[field]);
      }
      filter = applySearch(filter, req.query.search, searchFields);

      const { items, total } = await service.list({ sort, skip, limit, filter });
      res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
    }),

    get: asyncHandler(async (req, res) => {
      const id = requireObjectIdParam(req.params.id, `${label} id`);
      const data = await service.get(id);
      if (countryScoped && isCountryAdmin(req) && !ownsRecord(req, data)) {
        throw new ApiError(403, `You are not authorized to view this ${label}.`);
      }
      res.json({ success: true, data });
    }),

    create: asyncHandler(async (req, res) => {
      if (countryScoped && isCountryAdmin(req)) {
        if (!req.body?.country) {
          throw new ApiError(400, 'As a country administrator, "country" is required and must be your assigned country.');
        }
        assertCountryWritable(req, req.body.country);
      }
      try {
        const data = await service.create(req.body ?? {});
        res.status(201).json({ success: true, data });
      } catch (err) {
        if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
        throw err;
      }
    }),

    update: asyncHandler(async (req, res) => {
      const id = requireObjectIdParam(req.params.id, `${label} id`);
      await assertOwn(req, id, 'edit');
      if (countryScoped && isCountryAdmin(req) && req.body?.country !== undefined) {
        assertCountryWritable(req, req.body.country);
      }
      try {
        const data = await service.update(id, req.body ?? {});
        res.json({ success: true, data });
      } catch (err) {
        if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
        throw err;
      }
    }),

    remove: asyncHandler(async (req, res) => {
      const id = requireObjectIdParam(req.params.id, `${label} id`);
      await assertOwn(req, id, 'delete');
      await service.remove(id);
      res.json({ success: true, data: { message: `${label} deleted.` } });
    }),
  };
}

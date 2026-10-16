import * as continentAdminService from '../../services/admin/continentAdminService.js';
import { parsePagination, buildPaginationMeta, parseSort } from '../../utils/queryHelpers.js';
import { requireObjectIdParam, isDuplicateKeyError, duplicateKeyMessage, applySearch } from '../../utils/adminHelpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';

const SORTABLE_FIELDS = ['name', 'order', 'createdAt'];

export const listContinents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, SORTABLE_FIELDS, 'order');
  const filter = applySearch({}, req.query.search, ['name']);
  const { items, total } = await continentAdminService.listContinentsAdmin({ sort, skip, limit, filter });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getContinent = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'continent id');
  const data = await continentAdminService.getContinentAdmin(id);
  res.json({ success: true, data });
});

export const createContinent = asyncHandler(async (req, res) => {
  if (!req.body?.name) {
    throw new ApiError(400, '"name" is required.');
  }
  try {
    const data = await continentAdminService.createContinentAdmin(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

export const updateContinent = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'continent id');
  try {
    const data = await continentAdminService.updateContinentAdmin(id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, duplicateKeyMessage(err));
    throw err;
  }
});

export const deleteContinent = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'continent id');
  await continentAdminService.deleteContinentAdmin(id);
  res.json({ success: true, data: { message: 'Continent deleted.' } });
});

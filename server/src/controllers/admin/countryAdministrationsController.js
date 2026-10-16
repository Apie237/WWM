import * as adminService from '../../services/admin/countryAdministrationAdminService.js';
import { parsePagination, buildPaginationMeta } from '../../utils/queryHelpers.js';
import { requireObjectIdParam, isDuplicateKeyError, assertCountryWritable } from '../../utils/adminHelpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';

function docCountryId(doc) {
  return doc.country?._id ?? doc.country;
}

async function assertWritableDoc(req, id) {
  const doc = await adminService.getAdministrationAdmin(id);
  if (req.admin.role === 'COUNTRY_ADMIN') {
    assertCountryWritable(req, docCountryId(doc));
  }
  return doc;
}

export const listAdministrations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.admin.role === 'COUNTRY_ADMIN') {
    filter.country = req.admin.country?.id;
  } else if (req.query.country) {
    filter.country = requireObjectIdParam(req.query.country, 'country');
  }

  const { items, total } = await adminService.listAdministrationsAdmin({ filter, skip, limit });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getAdministration = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'administration id');
  const doc = await adminService.getAdministrationAdmin(id);
  if (req.admin.role === 'COUNTRY_ADMIN' && String(docCountryId(doc)) !== String(req.admin.country?.id)) {
    throw new ApiError(403, 'You are not authorized to view this record.');
  }
  res.json({ success: true, data: doc });
});

export const createAdministration = asyncHandler(async (req, res) => {
  if (req.admin.role === 'COUNTRY_ADMIN') {
    assertCountryWritable(req, req.body?.country);
  }
  try {
    const data = await adminService.createAdministrationAdmin(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, 'This country already has a current administration record. Edit it, or mark it historical before creating a new one.');
    }
    throw err;
  }
});

export const updateAdministration = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'administration id');
  await assertWritableDoc(req, id);
  try {
    const data = await adminService.updateAdministrationMetaAdmin(id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, 'This country already has a current administration record.');
    }
    throw err;
  }
});

export const deleteAdministration = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'administration id');
  await assertWritableDoc(req, id);
  await adminService.deleteAdministrationAdmin(id);
  res.json({ success: true, data: { message: 'Administration record deleted.' } });
});

export const addPosition = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'administration id');
  await assertWritableDoc(req, id);
  const data = await adminService.addPositionAdmin(id, req.body);
  res.status(201).json({ success: true, data });
});

export const updatePosition = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'administration id');
  const entryId = requireObjectIdParam(req.params.entryId, 'position id');
  await assertWritableDoc(req, id);
  const data = await adminService.updatePositionAdmin(id, entryId, req.body);
  res.json({ success: true, data });
});

export const removePosition = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'administration id');
  const entryId = requireObjectIdParam(req.params.entryId, 'position id');
  await assertWritableDoc(req, id);
  const data = await adminService.removePositionAdmin(id, entryId);
  res.json({ success: true, data });
});

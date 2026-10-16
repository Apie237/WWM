import * as adminService from '../../services/admin/affiliatePastorsBoardAdminService.js';
import { parsePagination, buildPaginationMeta } from '../../utils/queryHelpers.js';
import { requireObjectIdParam, isDuplicateKeyError, assertCountryWritable } from '../../utils/adminHelpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';

function docCountryId(doc) {
  return doc.country?._id ?? doc.country;
}

async function assertWritableDoc(req, id) {
  const doc = await adminService.getBoardAdmin(id);
  if (req.admin.role === 'COUNTRY_ADMIN') {
    assertCountryWritable(req, docCountryId(doc));
  }
  return doc;
}

export const listBoards = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.admin.role === 'COUNTRY_ADMIN') {
    filter.country = req.admin.country?.id;
  } else if (req.query.country) {
    filter.country = requireObjectIdParam(req.query.country, 'country');
  }

  const { items, total } = await adminService.listBoardsAdmin({ filter, skip, limit });
  res.json({ success: true, data: items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getBoard = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'board id');
  const doc = await adminService.getBoardAdmin(id);
  if (req.admin.role === 'COUNTRY_ADMIN' && String(docCountryId(doc)) !== String(req.admin.country?.id)) {
    throw new ApiError(403, 'You are not authorized to view this record.');
  }
  res.json({ success: true, data: doc });
});

export const createBoard = asyncHandler(async (req, res) => {
  if (req.admin.role === 'COUNTRY_ADMIN') {
    assertCountryWritable(req, req.body?.country);
  }
  try {
    const data = await adminService.createBoardAdmin(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, 'This country already has a current affiliate pastors board. Edit it, or mark it historical before creating a new one.');
    }
    throw err;
  }
});

export const updateBoard = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'board id');
  await assertWritableDoc(req, id);
  try {
    const data = await adminService.updateBoardMetaAdmin(id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, 'This country already has a current affiliate pastors board.');
    }
    throw err;
  }
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'board id');
  await assertWritableDoc(req, id);
  await adminService.deleteBoardAdmin(id);
  res.json({ success: true, data: { message: 'Affiliate pastors board deleted.' } });
});

export const addMember = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'board id');
  await assertWritableDoc(req, id);
  const data = await adminService.addMemberAdmin(id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateMember = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'board id');
  const entryId = requireObjectIdParam(req.params.entryId, 'member id');
  await assertWritableDoc(req, id);
  const data = await adminService.updateMemberAdmin(id, entryId, req.body);
  res.json({ success: true, data });
});

export const removeMember = asyncHandler(async (req, res) => {
  const id = requireObjectIdParam(req.params.id, 'board id');
  const entryId = requireObjectIdParam(req.params.entryId, 'member id');
  await assertWritableDoc(req, id);
  const data = await adminService.removeMemberAdmin(id, entryId);
  res.json({ success: true, data });
});

import mongoose from 'mongoose';
import { AffiliatePastorsBoard, Country, Person } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { pickAllowed, requireObjectIdField, assertPersonBelongsToCountry } from '../../utils/adminHelpers.js';

// Mirrors countryAdministrationAdminService.js exactly, with `members` in
// place of `positions` — see that file's comments for the reasoning behind
// the document/entry split (chicken-and-egg parentEntry ids) and the cycle/
// child-reassignment safeguards. AffiliatePastorsBoard and
// CountryAdministration are deliberately two separate, small, explicit admin
// services rather than one shared generic module, matching the existing
// project's own treatment of the two models as two distinct (if
// structurally similar) resources, each with its own public controller/
// service already.
export const BOARD_META_FIELDS = ['current', 'historical', 'effectiveFrom', 'effectiveTo', 'notes'];
export const MEMBER_ENTRY_WRITABLE_FIELDS = ['title', 'person', 'parentEntry', 'order', 'current', 'start', 'end', 'notes'];

async function assertCountryExists(countryId) {
  requireObjectIdField(countryId, 'country');
  const exists = await Country.exists({ _id: countryId });
  if (!exists) throw new ApiError(400, `Referenced country does not exist: ${countryId}`);
}

// Existence *and* (the Phase 7 security-review addition) relationship
// check: a member's `person` must actually belong to this board document's
// own country (a role there, or an internationally-scoped role —
// adminHelpers.js's assertPersonBelongsToCountry), so a COUNTRY_ADMIN
// cannot populate their own country's board with a person whose only
// connection to the database is an ObjectId that happens to exist.
async function assertPersonExistsIfSet(personId, countryId) {
  if (personId === undefined || personId === null) return;
  requireObjectIdField(personId, 'person');
  const exists = await Person.exists({ _id: personId });
  if (!exists) throw new ApiError(400, `Referenced person does not exist: ${personId}`);
  await assertPersonBelongsToCountry(personId, countryId, { fieldLabel: 'person' });
}

function assertValidParentEntry(parentEntry, existingEntryIds, ownEntryId) {
  if (parentEntry === undefined || parentEntry === null) return;
  const parentStr = String(parentEntry);
  if (ownEntryId && parentStr === String(ownEntryId)) {
    throw new ApiError(400, 'An entry cannot be its own parent.');
  }
  if (!existingEntryIds.has(parentStr)) {
    throw new ApiError(400, `"parentEntry" must reference another member already on this board: ${parentEntry}`);
  }
}

function assertNoCycle(members, startId, targetId) {
  const byId = new Map(members.map((m) => [String(m._id), m]));
  let current = startId ? String(startId) : null;
  for (let i = 0; i < members.length && current; i += 1) {
    if (current === String(targetId)) {
      throw new ApiError(400, 'This would create a circular reporting relationship.');
    }
    const entry = byId.get(current);
    current = entry?.parentEntry ? String(entry.parentEntry) : null;
  }
}

export async function listBoardsAdmin({ filter = {}, skip = 0, limit = 50 }) {
  const [items, total] = await Promise.all([
    AffiliatePastorsBoard.find(filter)
      .select('-__v')
      .populate({ path: 'country', select: 'name slug' })
      .populate({ path: 'members.person', select: 'displayName photoUrl' })
      .sort({ current: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AffiliatePastorsBoard.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getBoardAdmin(id) {
  const doc = await AffiliatePastorsBoard.findById(id)
    .select('-__v')
    .populate({ path: 'country', select: 'name slug' })
    .populate({ path: 'members.person', select: 'displayName photoUrl' })
    .lean();
  if (!doc) throw new ApiError(404, `Affiliate pastors board record not found: ${id}`);
  return doc;
}

export async function createBoardAdmin(body) {
  if (body.country === undefined) throw new ApiError(400, '"country" is required.');
  await assertCountryExists(body.country);

  const doc = new AffiliatePastorsBoard({
    country: body.country,
    members: [],
    ...pickAllowed(body, BOARD_META_FIELDS),
  });
  await doc.save();
  return doc.toObject();
}

export async function updateBoardMetaAdmin(id, body) {
  const doc = await AffiliatePastorsBoard.findById(id);
  if (!doc) throw new ApiError(404, `Affiliate pastors board record not found: ${id}`);
  doc.set(pickAllowed(body, BOARD_META_FIELDS));
  await doc.save();
  return doc.toObject();
}

export async function deleteBoardAdmin(id) {
  const doc = await AffiliatePastorsBoard.findById(id);
  if (!doc) throw new ApiError(404, `Affiliate pastors board record not found: ${id}`);
  await doc.deleteOne();
}

export async function addMemberAdmin(id, body) {
  const doc = await AffiliatePastorsBoard.findById(id);
  if (!doc) throw new ApiError(404, `Affiliate pastors board record not found: ${id}`);
  if (!body.title) throw new ApiError(400, '"title" is required.');

  await assertPersonExistsIfSet(body.person, doc.country);
  const existingIds = new Set(doc.members.map((m) => String(m._id)));
  assertValidParentEntry(body.parentEntry, existingIds, null);

  const entry = pickAllowed(body, MEMBER_ENTRY_WRITABLE_FIELDS);
  entry._id = new mongoose.Types.ObjectId();
  doc.members.push(entry);
  await doc.save();
  return doc.toObject();
}

export async function updateMemberAdmin(id, entryId, body) {
  const doc = await AffiliatePastorsBoard.findById(id);
  if (!doc) throw new ApiError(404, `Affiliate pastors board record not found: ${id}`);
  const entry = doc.members.id(entryId);
  if (!entry) throw new ApiError(404, `Member not found: ${entryId}`);

  if (body.person !== undefined) await assertPersonExistsIfSet(body.person, doc.country);
  if (body.parentEntry !== undefined) {
    const existingIds = new Set(doc.members.map((m) => String(m._id)));
    assertValidParentEntry(body.parentEntry, existingIds, entry._id);
    const plainMembers = doc.members.map((m) => m.toObject());
    assertNoCycle(plainMembers, body.parentEntry, entry._id);
  }

  entry.set(pickAllowed(body, MEMBER_ENTRY_WRITABLE_FIELDS));
  await doc.save();
  return doc.toObject();
}

export async function removeMemberAdmin(id, entryId) {
  const doc = await AffiliatePastorsBoard.findById(id);
  if (!doc) throw new ApiError(404, `Affiliate pastors board record not found: ${id}`);
  const entry = doc.members.id(entryId);
  if (!entry) throw new ApiError(404, `Member not found: ${entryId}`);

  const childCount = doc.members.filter((m) => m.parentEntry && String(m.parentEntry) === String(entryId)).length;
  if (childCount > 0) {
    throw new ApiError(409, `Cannot remove this member: ${childCount} other member(s) report to them. Reassign or remove them first.`);
  }

  entry.deleteOne();
  await doc.save();
  return doc.toObject();
}

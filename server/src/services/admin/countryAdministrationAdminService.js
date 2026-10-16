import mongoose from 'mongoose';
import { CountryAdministration, Country, Person } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { pickAllowed, requireObjectIdField } from '../../utils/adminHelpers.js';

// Document-level metadata an admin may edit directly. `positions` itself is
// never bulk-replaced through this field set — see addPositionAdmin/
// updatePositionAdmin/removePositionAdmin below for why entry-level
// operations are the primary way the hierarchy is edited.
export const ADMINISTRATION_META_FIELDS = ['current', 'historical', 'effectiveFrom', 'effectiveTo', 'notes'];
// One entry's own editable fields (docs/DESIGN_SPEC.md §6 — title/person/
// parentEntry/order/current/dates/notes; no position names are hardcoded
// here, they come entirely from the request body).
export const POSITION_ENTRY_WRITABLE_FIELDS = ['title', 'person', 'parentEntry', 'order', 'current', 'start', 'end', 'notes'];

async function assertCountryExists(countryId) {
  requireObjectIdField(countryId, 'country');
  const exists = await Country.exists({ _id: countryId });
  if (!exists) throw new ApiError(400, `Referenced country does not exist: ${countryId}`);
}

async function assertPersonExistsIfSet(personId) {
  if (personId === undefined || personId === null) return;
  requireObjectIdField(personId, 'person');
  const exists = await Person.exists({ _id: personId });
  if (!exists) throw new ApiError(400, `Referenced person does not exist: ${personId}`);
}

// `parentEntry` must be null, or the _id of another entry already present in
// this same document's `positions` array — never an arbitrary id, and never
// an id from a different country's administration document (the hierarchy
// is entirely local to one document, per the hierarchyEntrySchema comment in
// the model).
function assertValidParentEntry(parentEntry, existingEntryIds, ownEntryId) {
  if (parentEntry === undefined || parentEntry === null) return;
  const parentStr = String(parentEntry);
  if (ownEntryId && parentStr === String(ownEntryId)) {
    throw new ApiError(400, 'An entry cannot be its own parent.');
  }
  if (!existingEntryIds.has(parentStr)) {
    throw new ApiError(400, `"parentEntry" must reference another position already in this administration: ${parentEntry}`);
  }
}

// Walks parentEntry pointers upward from `startId`; throws if it ever
// reaches `targetId` (which would make targetId an ancestor of its own
// ancestor — a cycle). Bounded by the array length so a pre-existing
// corrupt chain can never loop forever.
function assertNoCycle(positions, startId, targetId) {
  const byId = new Map(positions.map((p) => [String(p._id), p]));
  let current = startId ? String(startId) : null;
  for (let i = 0; i < positions.length && current; i += 1) {
    if (current === String(targetId)) {
      throw new ApiError(400, 'This would create a circular reporting relationship.');
    }
    const entry = byId.get(current);
    current = entry?.parentEntry ? String(entry.parentEntry) : null;
  }
}

export async function listAdministrationsAdmin({ filter = {}, skip = 0, limit = 50 }) {
  const [items, total] = await Promise.all([
    CountryAdministration.find(filter)
      .select('-__v')
      .populate({ path: 'country', select: 'name slug' })
      .populate({ path: 'positions.person', select: 'displayName photoUrl' })
      .sort({ 'country.name': 1, current: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CountryAdministration.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getAdministrationAdmin(id) {
  const doc = await CountryAdministration.findById(id)
    .select('-__v')
    .populate({ path: 'country', select: 'name slug' })
    .populate({ path: 'positions.person', select: 'displayName photoUrl' })
    .lean();
  if (!doc) throw new ApiError(404, `Country administration record not found: ${id}`);
  return doc;
}

// Creates a new (by default "current") administration structure for a
// country, starting with an empty positions array — entries are then added
// one at a time via addPositionAdmin, which sidesteps the chicken-and-egg
// problem of a client needing an entry's server-assigned _id before it can
// reference it as another entry's parentEntry. The model's partial unique
// index (one current:true per country) turns a duplicate "current" create
// into a safe, catchable 409 rather than silently overwriting the existing
// current structure.
export async function createAdministrationAdmin(body) {
  if (body.country === undefined) throw new ApiError(400, '"country" is required.');
  await assertCountryExists(body.country);

  const doc = new CountryAdministration({
    country: body.country,
    positions: [],
    ...pickAllowed(body, ADMINISTRATION_META_FIELDS),
  });
  await doc.save();
  return doc.toObject();
}

export async function updateAdministrationMetaAdmin(id, body) {
  const doc = await CountryAdministration.findById(id);
  if (!doc) throw new ApiError(404, `Country administration record not found: ${id}`);
  doc.set(pickAllowed(body, ADMINISTRATION_META_FIELDS));
  await doc.save();
  return doc.toObject();
}

// Nothing references a CountryAdministration document by id, so deleting it
// outright is always safe.
export async function deleteAdministrationAdmin(id) {
  const doc = await CountryAdministration.findById(id);
  if (!doc) throw new ApiError(404, `Country administration record not found: ${id}`);
  await doc.deleteOne();
}

export async function addPositionAdmin(id, body) {
  const doc = await CountryAdministration.findById(id);
  if (!doc) throw new ApiError(404, `Country administration record not found: ${id}`);
  if (!body.title) throw new ApiError(400, '"title" is required.');

  await assertPersonExistsIfSet(body.person);
  const existingIds = new Set(doc.positions.map((p) => String(p._id)));
  assertValidParentEntry(body.parentEntry, existingIds, null);

  const entry = pickAllowed(body, POSITION_ENTRY_WRITABLE_FIELDS);
  entry._id = new mongoose.Types.ObjectId();
  doc.positions.push(entry);
  await doc.save();
  return doc.toObject();
}

export async function updatePositionAdmin(id, entryId, body) {
  const doc = await CountryAdministration.findById(id);
  if (!doc) throw new ApiError(404, `Country administration record not found: ${id}`);
  const entry = doc.positions.id(entryId);
  if (!entry) throw new ApiError(404, `Position not found: ${entryId}`);

  if (body.person !== undefined) await assertPersonExistsIfSet(body.person);
  if (body.parentEntry !== undefined) {
    const existingIds = new Set(doc.positions.map((p) => String(p._id)));
    assertValidParentEntry(body.parentEntry, existingIds, entry._id);
    const plainPositions = doc.positions.map((p) => p.toObject());
    assertNoCycle(plainPositions, body.parentEntry, entry._id);
  }

  entry.set(pickAllowed(body, POSITION_ENTRY_WRITABLE_FIELDS));
  await doc.save();
  return doc.toObject();
}

// Refuses to remove an entry that other entries still list as their parent —
// the admin must reassign or remove those children first, rather than the
// server silently leaving their parentEntry pointing at a now-deleted entry.
export async function removePositionAdmin(id, entryId) {
  const doc = await CountryAdministration.findById(id);
  if (!doc) throw new ApiError(404, `Country administration record not found: ${id}`);
  const entry = doc.positions.id(entryId);
  if (!entry) throw new ApiError(404, `Position not found: ${entryId}`);

  const childCount = doc.positions.filter((p) => p.parentEntry && String(p.parentEntry) === String(entryId)).length;
  if (childCount > 0) {
    throw new ApiError(409, `Cannot remove this position: ${childCount} other position(s) report to it. Reassign or remove them first.`);
  }

  entry.deleteOne();
  await doc.save();
  return doc.toObject();
}

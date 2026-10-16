import { Organization, Country, Person, Ministry } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import {
  pickAllowed,
  requireObjectIdField,
  requireValidObjectIdListField,
  assertPersonBelongsToCountry,
} from '../../utils/adminHelpers.js';
import { ORGANIZATION_TYPES } from '../../models/enums.js';

export const ORGANIZATION_WRITABLE_FIELDS = [
  'name',
  'slug',
  'type',
  'description',
  'country',
  'location',
  'contact',
  'leaders',
  'established',
  'isActive',
  'historical',
  'order',
  'notes',
];

async function assertCountryExists(countryId) {
  requireObjectIdField(countryId, 'country');
  const exists = await Country.exists({ _id: countryId });
  if (!exists) throw new ApiError(400, `Referenced country does not exist: ${countryId}`);
}

// Validates each leader's `person` reference: well-formed, exists, and
// actually belongs to this organization's own country (has a role there, or
// an internationally-scoped role — see adminHelpers.js's
// assertPersonBelongsToCountry). `countryId` is the organization's
// *effective* country — the one it will be saved with after this write, not
// merely the id a client happened to send — so a COUNTRY_ADMIN confined to
// their own country can never attach a leader with no connection to it, no
// matter how the person id was obtained.
export async function validateLeaders(leaders, countryId) {
  if (leaders === undefined) return undefined;
  if (!Array.isArray(leaders)) throw new ApiError(400, '"leaders" must be an array.');

  requireValidObjectIdListField(leaders.map((l) => l.person), 'leaders[].person');

  const personIds = [...new Set(leaders.map((l) => l.person).filter(Boolean).map(String))];
  if (personIds.length) {
    const found = await Person.find({ _id: { $in: personIds } }).select('_id').lean();
    const validIds = new Set(found.map((p) => String(p._id)));
    for (const leader of leaders) {
      if (!leader.person || !validIds.has(String(leader.person))) {
        throw new ApiError(400, `Referenced person does not exist: ${leader.person}`);
      }
    }
    for (const id of personIds) {
      await assertPersonBelongsToCountry(id, countryId, { fieldLabel: 'leaders[].person' });
    }
  }
  return leaders;
}

export async function listOrganizationsAdmin({ sort, skip, limit, filter = {} }) {
  const [items, total] = await Promise.all([
    Organization.find(filter)
      .select('-__v')
      .populate({ path: 'country', select: 'name slug' })
      .populate({ path: 'leaders.person', select: 'displayName photoUrl' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Organization.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getOrganizationAdmin(id) {
  const org = await Organization.findById(id)
    .select('-__v')
    .populate({ path: 'country', select: 'name slug' })
    .populate({ path: 'leaders.person', select: 'displayName photoUrl' })
    .lean();
  if (!org) throw new ApiError(404, `Organization not found: ${id}`);
  return org;
}

export async function createOrganizationAdmin(body) {
  if (!body.name) throw new ApiError(400, '"name" is required.');
  if (!body.type || !ORGANIZATION_TYPES.includes(body.type)) {
    throw new ApiError(400, `"type" must be one of: ${ORGANIZATION_TYPES.join(', ')}.`);
  }
  if (body.country === undefined) throw new ApiError(400, '"country" is required.');
  await assertCountryExists(body.country);

  const data = pickAllowed(body, ORGANIZATION_WRITABLE_FIELDS);
  data.leaders = await validateLeaders(data.leaders, body.country);

  const org = new Organization(data);
  await org.save();
  return org.toObject();
}

export async function updateOrganizationAdmin(id, body) {
  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, `Organization not found: ${id}`);

  if (body.type !== undefined && !ORGANIZATION_TYPES.includes(body.type)) {
    throw new ApiError(400, `"type" must be one of: ${ORGANIZATION_TYPES.join(', ')}.`);
  }
  if (body.country !== undefined) await assertCountryExists(body.country);

  // The organization's country *after* this save — whether this request
  // changes it or not — is what every leader must actually belong to
  // (docs/CLAUDE.md Phase 7 security review §2: a country change, or an
  // unrelated edit that leaves `country` untouched, must never leave a
  // leader from a different country behind).
  const effectiveCountryId = body.country !== undefined ? body.country : org.country;

  const data = pickAllowed(body, ORGANIZATION_WRITABLE_FIELDS);
  const effectiveLeaders = data.leaders !== undefined ? data.leaders : org.leaders;
  if (body.country !== undefined && data.leaders === undefined) {
    // Country is changing but leaders weren't resent — re-validate the
    // existing leaders against the new country rather than silently
    // leaving a now-invalid cross-country relationship in place.
    await validateLeaders(
      effectiveLeaders.map((l) => ({ person: l.person })),
      effectiveCountryId
    );
  } else {
    data.leaders = await validateLeaders(data.leaders, effectiveCountryId);
  }

  org.set(data);
  await org.save();
  return org.toObject();
}

// Rejects deletion if any Ministry or Person role still references this
// organization — both are independent incoming references that would
// otherwise be left pointing at nothing.
export async function deleteOrganizationAdmin(id) {
  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, `Organization not found: ${id}`);

  const [ministryCount, personCount] = await Promise.all([
    Ministry.countDocuments({ organization: id }),
    Person.countDocuments({ roles: { $elemMatch: { organization: id } } }),
  ]);

  const blockers = [];
  if (ministryCount > 0) blockers.push(`${ministryCount} ${ministryCount === 1 ? 'ministry references' : 'ministries reference'} it`);
  if (personCount > 0) blockers.push(`${personCount} ${personCount === 1 ? 'person has' : 'people have'} a role here`);

  if (blockers.length > 0) {
    throw new ApiError(409, `Cannot delete this organization: ${blockers.join(' and ')}. Remove or reassign those first.`);
  }

  await org.deleteOne();
}

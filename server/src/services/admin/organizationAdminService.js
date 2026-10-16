import { Organization, Country, Person, Ministry } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { pickAllowed, requireObjectIdField } from '../../utils/adminHelpers.js';
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

async function validateLeaders(leaders) {
  if (leaders === undefined) return undefined;
  if (!Array.isArray(leaders)) throw new ApiError(400, '"leaders" must be an array.');
  const personIds = [...new Set(leaders.map((l) => l.person).filter(Boolean).map(String))];
  if (personIds.length) {
    const found = await Person.find({ _id: { $in: personIds } }).select('_id').lean();
    const validIds = new Set(found.map((p) => String(p._id)));
    for (const leader of leaders) {
      if (!leader.person || !validIds.has(String(leader.person))) {
        throw new ApiError(400, `Referenced person does not exist: ${leader.person}`);
      }
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
  data.leaders = await validateLeaders(data.leaders);

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

  const data = pickAllowed(body, ORGANIZATION_WRITABLE_FIELDS);
  data.leaders = await validateLeaders(data.leaders);

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

import { Ministry, Country, Organization, Person } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { pickAllowed, requireObjectIdField } from '../../utils/adminHelpers.js';
import { MINISTRY_TYPES } from '../../models/enums.js';

export const MINISTRY_WRITABLE_FIELDS = [
  'name',
  'slug',
  'description',
  'ministryType',
  'country',
  'organization',
  'responsiblePeople',
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

async function assertOrganizationExists(organizationId) {
  requireObjectIdField(organizationId, 'organization');
  const exists = await Organization.exists({ _id: organizationId });
  if (!exists) throw new ApiError(400, `Referenced organization does not exist: ${organizationId}`);
}

async function validateResponsiblePeople(people) {
  if (people === undefined) return undefined;
  if (!Array.isArray(people)) throw new ApiError(400, '"responsiblePeople" must be an array.');
  const personIds = [...new Set(people.map((p) => p.person).filter(Boolean).map(String))];
  if (personIds.length) {
    const found = await Person.find({ _id: { $in: personIds } }).select('_id').lean();
    const validIds = new Set(found.map((p) => String(p._id)));
    for (const entry of people) {
      if (!entry.person || !validIds.has(String(entry.person))) {
        throw new ApiError(400, `Referenced person does not exist: ${entry.person}`);
      }
    }
  }
  return people;
}

export async function listMinistriesAdmin({ sort, skip, limit, filter = {} }) {
  const [items, total] = await Promise.all([
    Ministry.find(filter)
      .select('-__v')
      .populate({ path: 'country', select: 'name slug' })
      .populate({ path: 'organization', select: 'name slug' })
      .populate({ path: 'responsiblePeople.person', select: 'displayName photoUrl' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Ministry.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getMinistryAdmin(id) {
  const ministry = await Ministry.findById(id)
    .select('-__v')
    .populate({ path: 'country', select: 'name slug' })
    .populate({ path: 'organization', select: 'name slug' })
    .populate({ path: 'responsiblePeople.person', select: 'displayName photoUrl' })
    .lean();
  if (!ministry) throw new ApiError(404, `Ministry not found: ${id}`);
  return ministry;
}

export async function createMinistryAdmin(body) {
  if (!body.name) throw new ApiError(400, '"name" is required.');
  if (body.ministryType !== undefined && !MINISTRY_TYPES.includes(body.ministryType)) {
    throw new ApiError(400, `"ministryType" must be one of: ${MINISTRY_TYPES.join(', ')}.`);
  }
  if (body.country !== undefined) await assertCountryExists(body.country);
  if (body.organization !== undefined) await assertOrganizationExists(body.organization);

  const data = pickAllowed(body, MINISTRY_WRITABLE_FIELDS);
  data.responsiblePeople = await validateResponsiblePeople(data.responsiblePeople);

  const ministry = new Ministry(data);
  await ministry.save();
  return ministry.toObject();
}

export async function updateMinistryAdmin(id, body) {
  const ministry = await Ministry.findById(id);
  if (!ministry) throw new ApiError(404, `Ministry not found: ${id}`);

  if (body.ministryType !== undefined && !MINISTRY_TYPES.includes(body.ministryType)) {
    throw new ApiError(400, `"ministryType" must be one of: ${MINISTRY_TYPES.join(', ')}.`);
  }
  if (body.country !== undefined && body.country !== null) await assertCountryExists(body.country);
  if (body.organization !== undefined && body.organization !== null) await assertOrganizationExists(body.organization);

  const data = pickAllowed(body, MINISTRY_WRITABLE_FIELDS);
  data.responsiblePeople = await validateResponsiblePeople(data.responsiblePeople);

  ministry.set(data);
  await ministry.save();
  return ministry.toObject();
}

// Nothing in the data model references a Ministry by id (Person/Organization
// point the other way), so no dependent-record guard is needed here — a
// direct delete is already safe.
export async function deleteMinistryAdmin(id) {
  const ministry = await Ministry.findById(id);
  if (!ministry) throw new ApiError(404, `Ministry not found: ${id}`);
  await ministry.deleteOne();
}

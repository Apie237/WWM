import { Ministry, Country, Organization, Person } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import {
  pickAllowed,
  requireObjectIdField,
  requireValidObjectIdListField,
  assertPersonBelongsToCountry,
  assertOrganizationBelongsToCountry,
} from '../../utils/adminHelpers.js';
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

// Validates each responsible-person reference: well-formed, exists, and (when
// this ministry has a country at all) actually belongs to that country — a
// role there, or an internationally-scoped role (adminHelpers.js's
// assertPersonBelongsToCountry). `countryId` is the ministry's *effective*
// country after this write, not merely whatever the client sent. An
// international-scope ministry (`countryId` falsy) has no country to check
// a responsible person against, so the relationship check is skipped for it
// — there is no cross-country boundary to violate when the ministry itself
// declares no single country.
export async function validateResponsiblePeople(people, countryId) {
  if (people === undefined) return undefined;
  if (!Array.isArray(people)) throw new ApiError(400, '"responsiblePeople" must be an array.');

  requireValidObjectIdListField(people.map((p) => p.person), 'responsiblePeople[].person');

  const personIds = [...new Set(people.map((p) => p.person).filter(Boolean).map(String))];
  if (personIds.length) {
    const found = await Person.find({ _id: { $in: personIds } }).select('_id').lean();
    const validIds = new Set(found.map((p) => String(p._id)));
    for (const entry of people) {
      if (!entry.person || !validIds.has(String(entry.person))) {
        throw new ApiError(400, `Referenced person does not exist: ${entry.person}`);
      }
    }
    if (countryId) {
      for (const id of personIds) {
        await assertPersonBelongsToCountry(id, countryId, { fieldLabel: 'responsiblePeople[].person' });
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

  // A ministry's organization must belong to the ministry's own country,
  // unless the ministry is internationally scoped (no country at all) —
  // the one relationship the model explicitly permits to cross a single
  // country boundary, since there is no single country to compare against.
  if (body.organization && body.country) {
    await assertOrganizationBelongsToCountry(body.organization, body.country);
  }

  const data = pickAllowed(body, MINISTRY_WRITABLE_FIELDS);
  data.responsiblePeople = await validateResponsiblePeople(data.responsiblePeople, body.country);

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

  // The ministry's country/organization/responsiblePeople *after* this save
  // — whether this particular request touches each field or not — are what
  // must stay mutually consistent. Re-deriving them this way (rather than
  // only validating whatever happens to be in `body`) is what satisfies
  // "changes to a ministry's country cannot leave invalid cross-country
  // relationships behind": e.g. moving a ministry to a new country without
  // resending `organization`/`responsiblePeople` must still be rejected if
  // its *existing* organization or people no longer belong to that country.
  const effectiveCountryId = body.country !== undefined ? body.country : ministry.country;
  const effectiveOrganizationId = body.organization !== undefined ? body.organization : ministry.organization;
  const effectiveResponsiblePeople =
    body.responsiblePeople !== undefined ? body.responsiblePeople : ministry.responsiblePeople.map((p) => ({ person: p.person }));

  if (effectiveOrganizationId && effectiveCountryId) {
    await assertOrganizationBelongsToCountry(effectiveOrganizationId, effectiveCountryId);
  }
  await validateResponsiblePeople(effectiveResponsiblePeople, effectiveCountryId);

  const data = pickAllowed(body, MINISTRY_WRITABLE_FIELDS);
  if (data.responsiblePeople !== undefined) data.responsiblePeople = effectiveResponsiblePeople;

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

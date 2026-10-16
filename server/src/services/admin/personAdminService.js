import { Person, Country, Organization, Ministry, CountryAdministration, AffiliatePastorsBoard } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { pickAllowed, requireValidObjectIdListField } from '../../utils/adminHelpers.js';
import { PERSON_ROLE_TYPES } from '../../models/enums.js';

export const PERSON_WRITABLE_FIELDS = [
  'displayName',
  'name',
  'slug',
  'biography',
  'photoUrl',
  'lifeDates',
  'roles',
  'isActive',
  'order',
  'notes',
];

// Validates each role entry's shape/enum, that any referenced country or
// organization actually exists, and — the Phase 7 security-review addition
// — that a role naming *both* a country and an organization doesn't quietly
// create a cross-country relationship (e.g. "role in Kenya, organization in
// Nigeria"). A role with an organization but no country is left unchecked
// against the organization's country: it declares no country of its own to
// compare against, so there is nothing to be inconsistent with — the same
// "internationally-scoped reference" exception documented in
// adminHelpers.js. Combined with the controller's existing restriction that
// a COUNTRY_ADMIN's roles must all name their own country, this is what
// actually stops a COUNTRY_ADMIN from using a locally-scoped role to attach
// an organization belonging to another country. Returns the validated
// roles array unchanged (not reshaped), so callers can assign it straight
// onto the document.
export async function validateRoles(roles) {
  if (roles === undefined) return undefined;
  if (!Array.isArray(roles)) {
    throw new ApiError(400, '"roles" must be an array.');
  }

  requireValidObjectIdListField(roles.map((r) => r.country), 'roles[].country');
  requireValidObjectIdListField(roles.map((r) => r.organization), 'roles[].organization');

  const countryIds = [...new Set(roles.map((r) => r.country).filter(Boolean).map(String))];
  const organizationIds = [...new Set(roles.map((r) => r.organization).filter(Boolean).map(String))];

  const [countries, organizations] = await Promise.all([
    countryIds.length ? Country.find({ _id: { $in: countryIds } }).select('_id').lean() : [],
    organizationIds.length ? Organization.find({ _id: { $in: organizationIds } }).select('_id country').lean() : [],
  ]);
  const validCountryIds = new Set(countries.map((c) => String(c._id)));
  const organizationById = new Map(organizations.map((o) => [String(o._id), o]));

  for (const role of roles) {
    if (!PERSON_ROLE_TYPES.includes(role.roleType)) {
      throw new ApiError(400, `Invalid role type "${role.roleType}". Allowed values: ${PERSON_ROLE_TYPES.join(', ')}.`);
    }
    if (role.country && !validCountryIds.has(String(role.country))) {
      throw new ApiError(400, `Referenced country does not exist: ${role.country}`);
    }
    if (role.organization && !organizationById.has(String(role.organization))) {
      throw new ApiError(400, `Referenced organization does not exist: ${role.organization}`);
    }
    if (role.country && role.organization) {
      const org = organizationById.get(String(role.organization));
      if (String(org.country) !== String(role.country)) {
        throw new ApiError(
          400,
          `This role's organization belongs to a different country than the role's own country (${role.country}).`
        );
      }
    }
  }

  return roles;
}

export async function listPeopleAdmin({ sort, skip, limit, filter = {} }) {
  const [items, total] = await Promise.all([
    Person.find(filter)
      .select('-__v')
      .populate({ path: 'roles.country', select: 'name slug' })
      .populate({ path: 'roles.organization', select: 'name slug' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Person.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getPersonAdmin(id) {
  const person = await Person.findById(id)
    .select('-__v')
    .populate({ path: 'roles.country', select: 'name slug' })
    .populate({ path: 'roles.organization', select: 'name slug' })
    .lean();
  if (!person) throw new ApiError(404, `Person not found: ${id}`);
  return person;
}

export async function createPersonAdmin(body) {
  if (!body.displayName) {
    throw new ApiError(400, '"displayName" is required.');
  }
  const data = pickAllowed(body, PERSON_WRITABLE_FIELDS);
  data.roles = await validateRoles(data.roles);

  const person = new Person(data);
  await person.save();
  return person.toObject();
}

export async function updatePersonAdmin(id, body) {
  const person = await Person.findById(id);
  if (!person) throw new ApiError(404, `Person not found: ${id}`);

  const data = pickAllowed(body, PERSON_WRITABLE_FIELDS);
  data.roles = await validateRoles(data.roles);

  person.set(data);
  await person.save();
  return person.toObject();
}

// Rejects deletion if this person is still referenced as an organization
// leader, a ministry's responsible person, or a position/member holder in
// either leadership board — deleting them would leave a dangling reference
// in every one of those embedded arrays.
export async function deletePersonAdmin(id) {
  const person = await Person.findById(id);
  if (!person) throw new ApiError(404, `Person not found: ${id}`);

  const [orgCount, ministryCount, adminCount, boardCount] = await Promise.all([
    Organization.countDocuments({ 'leaders.person': id }),
    Ministry.countDocuments({ 'responsiblePeople.person': id }),
    CountryAdministration.countDocuments({ 'positions.person': id }),
    AffiliatePastorsBoard.countDocuments({ 'members.person': id }),
  ]);

  const blockers = [];
  if (orgCount > 0) blockers.push(`listed as a leader of ${orgCount} ${orgCount === 1 ? 'organization' : 'organizations'}`);
  if (ministryCount > 0) blockers.push(`listed as responsible for ${ministryCount} ${ministryCount === 1 ? 'ministry' : 'ministries'}`);
  if (adminCount > 0) blockers.push('holding a country administration position');
  if (boardCount > 0) blockers.push('holding an affiliate pastors board position');

  if (blockers.length > 0) {
    throw new ApiError(409, `Cannot delete this person: still ${blockers.join(', ')}. Remove those references first.`);
  }

  await person.deleteOne();
}

// `role.country` may be either a raw ObjectId (an unpopulated/just-submitted
// role) or a populated { _id, name, slug } object (as returned by
// getPersonAdmin, which populates roles.country for display) — this
// normalizes either shape to a comparable id string.
function roleCountryId(role) {
  if (!role?.country) return null;
  return String(role.country._id ?? role.country);
}

// True if every role on this person's current (or about-to-be-saved) roles
// array belongs to the given country — used by the controller to decide
// whether a COUNTRY_ADMIN may delete a person outright (only when the person
// has no roles outside their own country) vs. must leave the record alone.
export function allRolesBelongToCountry(roles, countryId) {
  if (!Array.isArray(roles) || roles.length === 0) return false;
  return roles.every((r) => roleCountryId(r) === String(countryId));
}

export function hasRoleInCountry(roles, countryId) {
  return Array.isArray(roles) && roles.some((r) => roleCountryId(r) === String(countryId));
}

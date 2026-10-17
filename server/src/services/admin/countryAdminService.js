import { Country, Continent, Organization, Ministry, Person, CountryAdministration, AffiliatePastorsBoard } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { pickAllowed, requireObjectIdField } from '../../utils/adminHelpers.js';
import { prepareImageField, releaseReplacedImage, releaseAssetIfUnreferenced } from '../mediaService.js';

const FLAG = { urlField: 'flagImageUrl', idField: 'flagImagePublicId', kind: 'countries' };

// Fields any admin allowed to write a Country at all may set.
const CONTENT_FIELDS = ['overview', 'flagImageUrl', 'flagImagePublicId', 'contact'];
// Structural/classification fields — reassigning a country's continent,
// renaming it, or changing its active/ordering status is international-level
// structure, not "this country's own content", so only SUPER_ADMIN/
// INTERNATIONAL_ADMIN may touch these (enforced by the controller selecting
// which field set to pass in, not re-derived here).
const STRUCTURAL_FIELDS = ['name', 'slug', 'isoCode', 'continent', 'isActive', 'order'];
export const COUNTRY_WRITABLE_FIELDS = [...CONTENT_FIELDS, ...STRUCTURAL_FIELDS];
export const COUNTRY_CONTENT_ONLY_FIELDS = CONTENT_FIELDS;

export async function listCountriesAdmin({ sort, skip, limit, filter = {} }) {
  const [items, total] = await Promise.all([
    Country.find(filter)
      .select('-__v')
      .populate({ path: 'continent', select: 'name slug' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Country.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getCountryAdmin(id) {
  const country = await Country.findById(id).select('-__v').populate({ path: 'continent', select: 'name slug' }).lean();
  if (!country) throw new ApiError(404, `Country not found: ${id}`);
  return country;
}

async function assertContinentExists(continentId) {
  requireObjectIdField(continentId, 'continent');
  const exists = await Continent.exists({ _id: continentId });
  if (!exists) throw new ApiError(400, `Referenced continent does not exist: ${continentId}`);
}

export async function createCountryAdmin(body) {
  if (body.continent === undefined) {
    throw new ApiError(400, '"continent" is required.');
  }
  await assertContinentExists(body.continent);

  const data = pickAllowed(body, COUNTRY_WRITABLE_FIELDS);
  await prepareImageField(data, null, FLAG);
  const country = new Country(data);
  await country.save();
  return country.toObject();
}

export async function updateCountryAdmin(id, body, allowedFields) {
  const country = await Country.findById(id);
  if (!country) throw new ApiError(404, `Country not found: ${id}`);

  if (body.continent !== undefined && allowedFields.includes('continent')) {
    await assertContinentExists(body.continent);
  }

  const data = pickAllowed(body, allowedFields);
  const change = await prepareImageField(data, country.toObject(), FLAG);
  country.set(data);
  await country.save();
  await releaseReplacedImage(change);
  return country.toObject();
}

// A country with any dependent organizational data is never deleted outright
// — every one of these models references Country directly (or, for Person,
// via roles[].country) and none of them cascade-delete.
export async function deleteCountryAdmin(id) {
  const country = await Country.findById(id);
  if (!country) throw new ApiError(404, `Country not found: ${id}`);

  const [orgCount, ministryCount, personCount, adminCount, boardCount] = await Promise.all([
    Organization.countDocuments({ country: id }),
    Ministry.countDocuments({ country: id }),
    Person.countDocuments({ roles: { $elemMatch: { country: id } } }),
    CountryAdministration.countDocuments({ country: id }),
    AffiliatePastorsBoard.countDocuments({ country: id }),
  ]);

  const blockers = [];
  if (orgCount > 0) blockers.push(`${orgCount} ${orgCount === 1 ? 'organization' : 'organizations'}`);
  if (ministryCount > 0) blockers.push(`${ministryCount} ${ministryCount === 1 ? 'ministry' : 'ministries'}`);
  if (personCount > 0) blockers.push(`${personCount} ${personCount === 1 ? 'person' : 'people'} with a role in this country`);
  if (adminCount > 0) blockers.push('a country administration record');
  if (boardCount > 0) blockers.push('an affiliate pastors board record');

  if (blockers.length > 0) {
    throw new ApiError(409, `Cannot delete this country: it still has ${blockers.join(', ')}. Remove or reassign them first.`);
  }

  const flagId = country.flagImagePublicId;
  await country.deleteOne();
  if (flagId) await releaseAssetIfUnreferenced(flagId);
}

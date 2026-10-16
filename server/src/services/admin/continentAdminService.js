import { Continent, Country } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { pickAllowed } from '../../utils/adminHelpers.js';

// Admin/CMS reads are deliberately NOT filtered to isActive:true (unlike the
// public continentService) — an administrator managing the directory needs
// to see and reactivate a deactivated continent, not have it disappear.
const WRITABLE_FIELDS = ['name', 'slug', 'code', 'description', 'order', 'isActive'];

export async function listContinentsAdmin({ sort, skip, limit, filter = {} }) {
  const [items, total] = await Promise.all([
    Continent.find(filter).select('-__v').sort(sort).skip(skip).limit(limit).lean(),
    Continent.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getContinentAdmin(id) {
  const continent = await Continent.findById(id).select('-__v').lean();
  if (!continent) throw new ApiError(404, `Continent not found: ${id}`);
  return continent;
}

export async function createContinentAdmin(body) {
  const continent = new Continent(pickAllowed(body, WRITABLE_FIELDS));
  await continent.save();
  return continent.toObject();
}

export async function updateContinentAdmin(id, body) {
  const continent = await Continent.findById(id);
  if (!continent) throw new ApiError(404, `Continent not found: ${id}`);
  continent.set(pickAllowed(body, WRITABLE_FIELDS));
  await continent.save();
  return continent.toObject();
}

// A continent with countries still pointing to it is never deleted outright
// (docs/CLAUDE.md Phase 7 §5 "Deleting a parent record must not silently
// orphan or cascade-delete dependent records") — the administrator must
// reassign or remove those countries first.
export async function deleteContinentAdmin(id) {
  const continent = await Continent.findById(id);
  if (!continent) throw new ApiError(404, `Continent not found: ${id}`);

  const countryCount = await Country.countDocuments({ continent: id });
  if (countryCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete this continent: ${countryCount} ${countryCount === 1 ? 'country' : 'countries'} still reference it. Reassign or remove them first.`
    );
  }

  await continent.deleteOne();
}

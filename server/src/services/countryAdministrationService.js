import { CountryAdministration } from '../models/index.js';
import { resolveCountryDocBySlug } from './countryService.js';

// Returns the country's *current* administration structure (or null if none
// has been recorded yet — a valid, expected state for a country with no
// seeded leadership data, not an error). `positions` is returned exactly as
// stored: whatever titles/hierarchy actually exist in the database, with no
// position names assumed or hardcoded here. The frontend's future
// LeadershipChart component reconstructs the tree from each position's
// `parentEntry` pointer.
export async function getCurrentAdministrationByCountrySlug(countrySlug) {
  const country = await resolveCountryDocBySlug(countrySlug); // 404s if the country itself doesn't exist

  const administration = await CountryAdministration.findOne({ country: country._id, current: true })
    .select('-__v')
    .populate({ path: 'positions.person', select: 'displayName photoUrl' })
    .lean();

  return administration || null;
}

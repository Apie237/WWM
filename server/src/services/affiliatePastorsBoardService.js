import { AffiliatePastorsBoard } from '../models/index.js';
import { resolveCountryDocBySlug } from './countryService.js';

// Mirrors countryAdministrationService: returns the country's current
// affiliate pastors board, or null if none is recorded yet. `members` is
// returned as stored — no position names (Chairman, Secretary, etc.) are
// assumed here; those are only example values from the design reference.
export async function getCurrentBoardByCountrySlug(countrySlug) {
  const country = await resolveCountryDocBySlug(countrySlug);

  const board = await AffiliatePastorsBoard.findOne({ country: country._id, current: true })
    .select('-__v')
    .populate({ path: 'members.person', select: 'displayName photoUrl' })
    .lean();

  return board || null;
}

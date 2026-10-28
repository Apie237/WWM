// UI labels for the History feature. Structural text only — all historical
// content comes from the database (HistoryEvent records).
export const HISTORY_SECTION_LABELS = {
  introduction: 'Introduction',
  origins: 'International origins',
  cameroon: 'Mission in Cameroon',
  'cameroon-leadership': 'Leadership in Cameroon',
  'international-leadership': 'International leadership',
  records: 'Historical records',
  'international-growth': 'International growth',
}

export const HISTORY_ENTRY_TYPE_LABELS = { event: 'Milestone', record: 'Historical record', pending: 'Pending information' }

export const HISTORY_REVIEW_LABELS = {
  unreviewed: 'Not reviewed',
  needs_confirmation: 'Needs founder confirmation',
  confirmed: 'Confirmed by founder',
}

// The photograph for an entry: its own image, otherwise the linked person's
// photo — but only when exactly one person is linked, so a group entry (e.g. a
// couple) never borrows one individual's portrait.
export function entryImage(entry) {
  if (entry.imageUrl) return { url: entry.imageUrl, alt: entry.imageAlt || entry.title }
  const people = entry.people || []
  if (people.length === 1 && people[0].photoUrl) {
    return { url: people[0].photoUrl, alt: entry.imageAlt || people[0].displayName }
  }
  return null
}

export function placeholderLabel(entry) {
  const people = entry.people || []
  const subject = entry.imageCaption || (people.length === 1 ? people[0].displayName : entry.title)
  return `Photograph of ${subject} coming soon`
}

// Entries that are only "information to come" placeholders are never shown to
// visitors: the public page lists real, published history only.
export function publicHistoryItems(items) {
  return (items || []).filter((item) => item.entryType !== 'pending')
}

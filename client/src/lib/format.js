// Small formatting helpers shared by content cards — no organizational data
// lives here, just display formatting for values that already come from the
// API (enum labels, loose dates).

export function formatEnumLabel(value) {
  if (!value) return ''
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Person.roles / Organization.established use a "loose date" shape
// ({ date, year, approximate }) so uncertain historical dates are never
// silently resolved to a single hard value (docs/PROJECT_SPEC.md §12).
export function formatLooseDate(looseDate) {
  if (!looseDate) return null
  const year = looseDate.year ?? (looseDate.date ? new Date(looseDate.date).getFullYear() : null)
  if (!year) return null
  return looseDate.approximate ? `approx. ${year}` : String(year)
}

export function formatLifeDates(lifeDates) {
  if (!lifeDates) return null
  const born = formatLooseDate(lifeDates.born)
  const died = formatLooseDate(lifeDates.died)
  if (!born && !died) return null
  return `${born ?? '?'}–${died ?? 'present'}`
}

// Display-only fallback for a route slug when the real record (and its
// proper display name) hasn't loaded yet or failed to load — e.g. a
// breadcrumb shown while a continent/country fetch is still pending. Never
// used as a substitute for real API data once it has loaded.
export function titleCaseFromSlug(slug) {
  if (!slug) return ''
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

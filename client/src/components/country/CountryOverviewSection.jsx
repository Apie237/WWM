import { MapPin } from 'lucide-react'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'
import EmptyState from '../ui/EmptyState.jsx'

// Overview group of the country section navigation (docs/DESIGN_SPEC.md §5):
// country identity, flag, description, representative photo, and mission
// history. `country` is the record already loaded by CountryPage — no
// separate fetch. HistoryEvent has no API yet (a later content model per
// docs/PROJECT_SPEC.md §6), so history renders an explicit "not yet
// published" state rather than any hardcoded narrative.
export default function CountryOverviewSection({ country }) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
      <div>
        <div className="flex items-center gap-3">
          {country.flagImageUrl ? (
            <img
              src={country.flagImageUrl}
              alt={`Flag of ${country.name}`}
              className="h-7 w-10 shrink-0 border border-wwm-neutral-300 object-cover"
            />
          ) : (
            <span className="flex h-7 w-10 shrink-0 items-center justify-center border border-wwm-neutral-300 bg-wwm-neutral-100 text-wwm-neutral-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <h3 className="text-lg font-extrabold uppercase tracking-wide text-wwm-navy">{country.name}</h3>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-wwm-neutral-900">
          {country.overview || 'A description for this country has not yet been published.'}
        </p>

        <div className="mt-8 border-t border-wwm-neutral-300 pt-6">
          <h4 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Country Mission History</h4>
          <div className="mt-4">
            <EmptyState
              title="Historical timeline not yet published"
              description="A structured mission history for this country will appear here once historical records are added to the directory."
            />
          </div>
        </div>
      </div>

      <ImagePlaceholder label={`${country.name} representative photograph`} />
    </div>
  )
}

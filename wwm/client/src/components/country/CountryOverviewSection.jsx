import { MapPin } from 'lucide-react'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import LoadingState from '../ui/LoadingState.jsx'
import { imageSrc } from '../../lib/images.js'
import { useFetch } from '../../hooks/useFetch.js'
import { getHistory } from '../../services/api.js'

// Overview group of the country section navigation (docs/DESIGN_SPEC.md §5):
// country identity, flag, description, representative photo, and mission
// history. `country` is the record already loaded by CountryPage. Mission
// history comes from the published HistoryEvent entries linked to this country
// (GET /api/history?country=<slug>); when none are linked it renders an
// explicit "not yet published" state rather than any hardcoded narrative.
export default function CountryOverviewSection({ country }) {
  const history = useFetch(getHistory, { country: country.slug, limit: 50 })
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
      <div>
        <div className="flex items-center gap-3">
          {country.flagImageUrl ? (
            <img
              src={imageSrc(country.flagImageUrl, 120)}
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
            {history.status === 'loading' && <LoadingState label="Loading mission history…" />}
            {history.status === 'error' && (
              <EmptyState
                title="Mission history unavailable"
                description="The historical records could not be loaded. Please try again later."
              />
            )}
            {history.status === 'ready' && history.data.length === 0 && (
              <EmptyState
                title="Historical timeline not yet published"
                description="A structured mission history for this country will appear here once historical records are added to the directory."
              />
            )}
            {history.status === 'ready' && history.data.length > 0 && (
              <ol className="space-y-5 border-l-2 border-wwm-gold/60 pl-5">
                {history.data.map((entry) => (
                  <li key={entry._id}>
                    {entry.dateLabel && (
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wwm-gold">
                        {entry.approximateDate ? `c. ${entry.dateLabel}` : entry.dateLabel}
                      </p>
                    )}
                    <h5 className="mt-1 text-sm font-bold text-wwm-navy">{entry.title}</h5>
                    {entry.description && (
                      <p className="mt-1 text-sm leading-relaxed text-wwm-neutral-900">{entry.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      <ImagePlaceholder label={`${country.name} representative photograph`} />
    </div>
  )
}

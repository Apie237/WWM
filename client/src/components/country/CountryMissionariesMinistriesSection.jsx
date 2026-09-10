import { useEffect, useState } from 'react'
import LoadingState from '../ui/LoadingState.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import PersonCard from '../content/PersonCard.jsx'
import { getMinistries, getPeople } from '../../services/api.js'

// Missionaries & Ministries group of the country section navigation
// (docs/DESIGN_SPEC.md §5) — both scoped to this country via the existing
// Person (`role=missionary&country=`) and Ministry (`country=`) API filters;
// no Missionary model or new backend capability was needed.
export default function CountryMissionariesMinistriesSection({ countrySlug }) {
  const [missionaries, setMissionaries] = useState({ loading: true, data: [] })
  const [ministries, setMinistries] = useState({ loading: true, data: [] })

  useEffect(() => {
    let cancelled = false
    getPeople({ role: 'missionary', country: countrySlug, limit: 24 })
      .then(({ data }) => !cancelled && setMissionaries({ loading: false, data }))
      .catch(() => !cancelled && setMissionaries({ loading: false, data: [] }))
    getMinistries({ country: countrySlug, limit: 24 })
      .then(({ data }) => !cancelled && setMinistries({ loading: false, data }))
      .catch(() => !cancelled && setMinistries({ loading: false, data: [] }))
    return () => {
      cancelled = true
    }
  }, [countrySlug])

  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Missionaries</h3>
        <div className="mt-5">
          {missionaries.loading ? (
            <LoadingState label="Loading missionaries…" />
          ) : missionaries.data.length === 0 ? (
            <EmptyState
              title="No missionaries listed yet"
              description="Missionaries serving in this country will appear here once they are added to the directory."
            />
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-6">
              {missionaries.data.map((person) => (
                <PersonCard key={person._id} person={person} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-wwm-neutral-300 pt-10">
        <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Ministries</h3>
        <div className="mt-5">
          {ministries.loading ? (
            <LoadingState label="Loading ministries…" />
          ) : ministries.data.length === 0 ? (
            <EmptyState
              title="No ministries listed yet"
              description="Active ministries in this country will appear here once they are added to the directory."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ministries.data.map((ministry) => (
                <div key={ministry._id} className="border border-wwm-neutral-300 p-5">
                  <p className="text-sm font-bold text-wwm-navy">{ministry.name}</p>
                  {ministry.description && (
                    <p className="mt-2 text-sm leading-relaxed text-wwm-neutral-600">{ministry.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

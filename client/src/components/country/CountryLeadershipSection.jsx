import { useEffect, useState } from 'react'
import LoadingState from '../ui/LoadingState.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import LeadershipChart from '../content/LeadershipChart.jsx'
import PersonCard from '../content/PersonCard.jsx'
import { getAffiliatePastorsBoard, getCountryAdministration, getPeople } from '../../services/api.js'

// Leadership group of the country section navigation (docs/DESIGN_SPEC.md
// §5): Country Administration and Affiliate Pastors Board render through the
// shared, data-driven LeadershipChart (docs/PROJECT_SPEC.md §10-§11); WWM
// Pastors reuse the existing PersonCard, filtered to role=pastor for this
// country via the existing Person API — no Pastor model/component is created.
export default function CountryLeadershipSection({ countrySlug }) {
  const [state, setState] = useState({ loading: true, administration: null, board: null, pastors: [] })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true }))

    Promise.allSettled([
      getCountryAdministration(countrySlug),
      getAffiliatePastorsBoard(countrySlug),
      getPeople({ role: 'pastor', country: countrySlug, limit: 50 }),
    ]).then(([administration, board, pastors]) => {
      if (cancelled) return
      setState({
        loading: false,
        administration: administration.status === 'fulfilled' ? administration.value.data : null,
        board: board.status === 'fulfilled' ? board.value.data : null,
        pastors: pastors.status === 'fulfilled' ? pastors.value.data : [],
      })
    })

    return () => {
      cancelled = true
    }
  }, [countrySlug])

  if (state.loading) {
    return <LoadingState label="Loading leadership…" />
  }

  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Country Administration</h3>
        <div className="mt-5">
          <LeadershipChart
            entries={state.administration?.positions}
            emptyTitle="No country administration published yet"
            emptyDescription="This country's leadership structure has not yet been added to the directory."
          />
        </div>
      </div>

      <div className="border-t border-wwm-neutral-300 pt-10">
        <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">WWM Pastors</h3>
        <div className="mt-5">
          {state.pastors.length === 0 ? (
            <EmptyState
              title="No pastors listed yet"
              description="Pastors serving in this country will appear here once they are added to the directory."
            />
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-6">
              {state.pastors.map((person) => (
                <PersonCard key={person._id} person={person} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-wwm-neutral-300 pt-10">
        <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Affiliate Pastors Board</h3>
        <div className="mt-5">
          <LeadershipChart
            entries={state.board?.members}
            emptyTitle="No affiliate pastors board published yet"
            emptyDescription="This country's affiliate pastors board has not yet been added to the directory."
          />
        </div>
      </div>
    </div>
  )
}

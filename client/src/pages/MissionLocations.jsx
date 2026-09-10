import { useEffect, useState } from 'react'
import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ImagePlaceholder from '../components/ui/ImagePlaceholder.jsx'
import ContinentCard from '../components/content/ContinentCard.jsx'
import { getContinents } from '../services/api.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

// Mission Locations landing page — the global directory entry point
// (docs/DESIGN_SPEC.md §4, Phase 5 instructions §5). Continent tiles link
// into the Phase 5 `/mission-locations/:continent` → `/mission-locations/
// :continent/:country` drill-down built on the existing Continent/Country
// public API.
export default function MissionLocations() {
  useDocumentTitle('Mission Locations | World Wide Missions')
  const [state, setState] = useState({ loading: true, data: [] })

  useEffect(() => {
    let cancelled = false
    getContinents()
      .then(({ data }) => !cancelled && setState({ loading: false, data }))
      .catch(() => !cancelled && setState({ loading: false, data: [] }))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Mission Locations' }]}
          title="Mission Locations"
          description="World Wide Missions serves communities across every inhabited continent. Select a continent to begin exploring."
        />
      </SectionBand>

      <SectionBand tone="white">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.3fr]">
          <ImagePlaceholder label="World presence map" ratio="aspect-square" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-wwm-neutral-600">Select a Continent</p>
            <div className="mt-4">
              {state.loading ? (
                <LoadingState label="Loading continents…" />
              ) : state.data.length === 0 ? (
                <EmptyState
                  title="Mission locations coming soon"
                  description="The mission locations directory is being compiled."
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {state.data.map((continent) => (
                    <ContinentCard key={continent.slug} continent={continent} />
                  ))}
                </div>
              )}
            </div>
            <p className="mt-6 text-sm text-wwm-neutral-600">
              Select a continent to explore its countries, or open a country directly to view its administration,
              pastors, churches, institutions, missionaries, and ministries.
            </p>
          </div>
        </div>
      </SectionBand>
    </>
  )
}

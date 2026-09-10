import { useEffect, useState } from 'react'
import SectionBand from '../ui/SectionBand.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import CTAButton from '../ui/CTAButton.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'
import ContinentCard from '../content/ContinentCard.jsx'
import { getContinents } from '../../services/api.js'

// Mission Locations preview — the visual/navigation entry point required by
// Phase 4. The full Continents → Countries → Country drill-down hierarchy
// belongs to Phase 5 and is intentionally not built here.
export default function MissionLocationsBand() {
  const [continents, setContinents] = useState(null)

  useEffect(() => {
    let cancelled = false
    getContinents()
      .then(({ data }) => {
        if (!cancelled) setContinents(data)
      })
      .catch(() => {
        if (!cancelled) setContinents([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SectionBand tone="white" id="mission-locations-preview">
      <SectionHeader eyebrow="Home / Mission Locations" title="Mission Locations" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
        <ImagePlaceholder label="World presence map" ratio="aspect-[4/3]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-wwm-neutral-600">Select a Continent</p>
          <div className="mt-4">
            {continents === null ? (
              <p className="text-sm text-wwm-neutral-600">Loading continents…</p>
            ) : continents.length === 0 ? (
              <EmptyState title="Mission locations coming soon" description="The mission locations directory is being compiled." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {continents.map((continent) => (
                  <ContinentCard key={continent.slug} continent={continent} />
                ))}
              </div>
            )}
          </div>
          <CTAButton to="/mission-locations" variant="tertiary" className="mt-6">
            View All Mission Locations
          </CTAButton>
        </div>
      </div>
    </SectionBand>
  )
}

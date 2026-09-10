import { useEffect, useState } from 'react'
import SectionBand from '../ui/SectionBand.jsx'
import CTAButton from '../ui/CTAButton.jsx'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import PioneerCard from '../content/PioneerCard.jsx'
import { getPeople } from '../../services/api.js'

// Heritage/legacy narrative + pioneer profiles, on the cream heritage
// surface (docs/DESIGN_SPEC.md §3, §8). Pioneer profiles are read from the
// Person API (role=founder) rather than hardcoded — docs/PROJECT_SPEC.md §12
// treats the supplied Smalldridge/Miller history as seed material for a
// later phase, not content to bake into this component.
export default function HeritageBand() {
  const [pioneers, setPioneers] = useState(null)

  useEffect(() => {
    let cancelled = false
    getPeople({ role: 'founder', limit: 4 })
      .then(({ data }) => {
        if (!cancelled) setPioneers(data)
      })
      .catch(() => {
        if (!cancelled) setPioneers([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SectionBand tone="cream">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wwm-gold">Our Heritage</p>
          <h2 className="mt-2 text-2xl font-extrabold uppercase tracking-wide text-wwm-navy sm:text-3xl">Our Legacy</h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-wwm-neutral-900">
            Founded through the vision of missionaries who answered God&rsquo;s call, World Wide Missions continues the
            work of reaching the lost and building strong communities of faith.
          </p>
          <CTAButton to="/about#our-history" variant="tertiary" className="mt-6">
            Our Story
          </CTAButton>
        </div>
        <ImagePlaceholder label="Archival heritage photograph" />
      </div>

      <div className="mt-12 border-t border-wwm-neutral-300 pt-10">
        <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Our Pioneers</h3>
        <div className="mt-6">
          {pioneers === null ? (
            <p className="text-sm text-wwm-neutral-600">Loading pioneer profiles…</p>
          ) : pioneers.length === 0 ? (
            <EmptyState
              title="Pioneer profiles coming soon"
              description="Founder and pioneer profiles will appear here once they are added to the organizational directory."
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {pioneers.map((person) => (
                <PioneerCard key={person._id} person={person} />
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionBand>
  )
}

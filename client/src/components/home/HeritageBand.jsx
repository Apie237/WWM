import { useEffect, useState } from 'react'
import SectionBand from '../ui/SectionBand.jsx'
import CTAButton from '../ui/CTAButton.jsx'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import PioneerCard from '../content/PioneerCard.jsx'
import { getPeople, getHistory } from '../../services/api.js'
import { imageSrc, imageSrcSet } from '../../lib/images.js'

// Heritage/legacy narrative + pioneer profiles, on the cream heritage
// surface (docs/DESIGN_SPEC.md §3, §8). Pioneer profiles are read from the
// Person API (role=founder) rather than hardcoded — docs/PROJECT_SPEC.md §12
// treats the supplied Smalldridge/Miller history as seed material for a
// later phase, not content to bake into this component.
export default function HeritageBand() {
  const [pioneers, setPioneers] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [photoBroken, setPhotoBroken] = useState(false)

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

  // The archival photograph is the first published "origins" History entry that
  // has a photograph of its own (uploaded in Admin → History). Nothing is shown
  // that was not published there; with none (or on any error) the labelled
  // placeholder stays.
  useEffect(() => {
    let cancelled = false
    getHistory({ section: 'origins', limit: 50 })
      .then(({ data }) => {
        const entry = data.find((e) => e.imageUrl)
        if (!cancelled && entry) setPhoto({ url: entry.imageUrl, alt: entry.imageAlt || entry.title, caption: entry.imageCaption })
      })
      .catch(() => {})
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
          <CTAButton to="/history" variant="tertiary" className="mt-6">
            Our Story
          </CTAButton>
        </div>
        {photo && !photoBroken ? (
          <figure>
            <img
              src={imageSrc(photo.url, 800)}
              srcSet={imageSrcSet(photo.url, [480, 800, 1200])}
              sizes="(min-width: 1024px) 560px, 100vw"
              alt={photo.alt}
              loading="lazy"
              onError={() => setPhotoBroken(true)}
              className="aspect-[4/3] w-full border border-wwm-neutral-300 bg-wwm-white object-cover object-top"
            />
            {photo.caption && <figcaption className="mt-2 text-xs text-wwm-neutral-600">{photo.caption}</figcaption>}
          </figure>
        ) : (
          <ImagePlaceholder label="Archival heritage photograph" />
        )}
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

import { useEffect, useState } from 'react'
import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import InPageNav from '../components/ui/InPageNav.jsx'
import PlaceholderSection from '../components/ui/PlaceholderSection.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import CTAButton from '../components/ui/CTAButton.jsx'
import PersonCard from '../components/content/PersonCard.jsx'
import { getPeople } from '../services/api.js'

const SECTIONS = [
  { id: 'who-we-are', label: 'Who We Are' },
  { id: 'mission', label: 'Mission' },
  { id: 'vision', label: 'Vision' },
  { id: 'values', label: 'Values' },
  { id: 'beliefs', label: 'Beliefs' },
  { id: 'purpose', label: 'Purpose' },
  { id: 'our-approach', label: 'Our Approach' },
  { id: 'national-leadership', label: 'National Leadership' },
  { id: 'our-history', label: 'Our History' },
  { id: 'international-administration', label: 'Int’l Administration' },
  { id: 'legal', label: 'Legal & Organizational' },
]

// Page shell for every About Us subsection (Phase 4 instructions). Only the
// two subsections backed by verified, project-owner-supplied data
// (International Administration via the Person API, and the official
// Purpose statement from docs/PROJECT_SPEC.md §12) render real content —
// everything else is an honest placeholder pending approved copy.
export default function About() {
  const [leaders, setLeaders] = useState(null)

  useEffect(() => {
    let cancelled = false
    getPeople({ role: 'administrator', current: 'true', limit: 12 })
      .then(({ data }) => {
        if (!cancelled) setLeaders(data)
      })
      .catch(() => {
        if (!cancelled) setLeaders([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[{ label: 'Home', to: '/' }, { label: 'About Us' }]}
          title="About Us"
          description="Who we are, what we believe, and how World Wide Missions serves communities across the globe."
        />
      </SectionBand>

      <InPageNav items={SECTIONS} />

      <SectionBand tone="white">
        <PlaceholderSection id="who-we-are" title="Who We Are" />
        <PlaceholderSection id="mission" title="Mission" />
        <PlaceholderSection id="vision" title="Vision" />
        <PlaceholderSection id="values" title="Values" />
        <PlaceholderSection id="beliefs" title="Beliefs" />

        <div id="purpose" className="scroll-mt-40 border-t border-wwm-neutral-300 py-10">
          <SectionHeader title="Purpose" />
          <blockquote className="mt-5 max-w-3xl border-l-2 border-wwm-gold pl-5 italic leading-relaxed text-wwm-neutral-900">
            &ldquo;Religious, charitable, benevolent body of believers, working together to promote production and
            distribution of Christian literature, to further the training of ministers and other religious workers and
            to furnish their support, to conduct religious services, and to improve the moral and social conditions of
            humanity.&rdquo;
          </blockquote>
        </div>

        <PlaceholderSection id="our-approach" title="Our Approach" />

        <div id="national-leadership" className="scroll-mt-40 border-t border-wwm-neutral-300 py-10">
          <SectionHeader title="National Leadership" />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-wwm-neutral-600">
            National Leadership is an organizational approach, not a historical event — it describes World Wide
            Missions&rsquo; commitment to developing and supporting national Christian leadership in every country
            where it serves. A fuller description of this approach will be published here once approved.
          </p>
        </div>

        <div id="our-history" className="scroll-mt-40 border-t border-wwm-neutral-300 py-10">
          <SectionHeader title="Our History" />
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-wwm-neutral-900">
            From its international origins to its mission work in Cameroon and beyond, the history of World Wide Missions
            is presented on its own page, with photographs, a leadership timeline and historical records.
          </p>
          <CTAButton to="/history" variant="tertiary" className="mt-5">
            Read Our History
          </CTAButton>
        </div>

        <div id="international-administration" className="scroll-mt-40 border-t border-wwm-neutral-300 py-10">
          <SectionHeader title="International Administration" />
          <div className="mt-5">
            {leaders === null ? (
              <p className="text-sm text-wwm-neutral-600">Loading leadership directory…</p>
            ) : leaders.length === 0 ? (
              <EmptyState
                title="Leadership directory coming soon"
                description="International Administration profiles will appear here once they are added to the directory."
              />
            ) : (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {leaders.map((person) => (
                  <PersonCard key={person._id} person={person} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div id="legal" className="scroll-mt-40 border-t border-wwm-neutral-300 py-10">
          <SectionHeader title="Legal & Organizational Information" />
          <div className="mt-5">
            <EmptyState
              title="Legal documents coming soon"
              description="Founding documents and organizational decrees will be listed here, with scanned originals linked once media support is added."
            />
          </div>
        </div>
      </SectionBand>
    </>
  )
}

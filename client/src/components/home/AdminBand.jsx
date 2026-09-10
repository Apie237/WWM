import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionBand from '../ui/SectionBand.jsx'
import CTAButton from '../ui/CTAButton.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import PersonCard from '../content/PersonCard.jsx'
import { getPeople } from '../../services/api.js'

const ABOUT_LINKS = [
  { label: 'Mission Statement', to: '/about#mission' },
  { label: 'Our Vision', to: '/about#vision' },
  { label: 'Our Values', to: '/about#values' },
  { label: 'Our Heritage', to: '/about#our-history' },
  { label: 'International Administration', to: '/about#international-administration' },
  { label: 'Leadership', to: '/about#national-leadership' },
  { label: 'Our Beliefs', to: '/about#beliefs' },
]

// About Us / International Administration two-card row
// (docs/DESIGN_SPEC.md §3 band 5). Leadership is read from the Person API
// (role=administrator, current=true) rather than a named leadership team
// hardcoded into JSX.
export default function AdminBand() {
  const [leaders, setLeaders] = useState(null)

  useEffect(() => {
    let cancelled = false
    getPeople({ role: 'administrator', current: 'true', limit: 8 })
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
    <SectionBand tone="white">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="border border-wwm-neutral-300 p-6 sm:p-8">
          <p className="text-xs text-wwm-neutral-600">Home / About Us</p>
          <h2 className="mt-2 text-lg font-extrabold uppercase tracking-wide text-wwm-navy">About Us</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-[160px_1fr]">
            <ul className="space-y-2 border-wwm-neutral-300 sm:border-r sm:pr-6">
              {ABOUT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-wwm-navy hover:text-wwm-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed text-wwm-neutral-600">
              Learn who we are, what we believe, and how World Wide Missions serves communities across the globe.
            </p>
          </div>
        </div>

        <div className="border border-wwm-neutral-300 p-6 sm:p-8">
          <p className="text-xs text-wwm-neutral-600">Home / About Us / International Administration</p>
          <h2 className="mt-2 text-lg font-extrabold uppercase tracking-wide text-wwm-navy">International Administration</h2>
          <div className="mt-5">
            {leaders === null ? (
              <p className="text-sm text-wwm-neutral-600">Loading leadership directory…</p>
            ) : leaders.length === 0 ? (
              <EmptyState
                title="Leadership directory coming soon"
                description="International Administration profiles will appear here once they are added."
              />
            ) : (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {leaders.map((person) => (
                  <PersonCard key={person._id} person={person} />
                ))}
              </div>
            )}
          </div>
          <CTAButton to="/about#international-administration" variant="tertiary" className="mt-6">
            Read All Leadership
          </CTAButton>
        </div>
      </div>
    </SectionBand>
  )
}

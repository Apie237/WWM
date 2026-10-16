import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import InPageNav from '../components/ui/InPageNav.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import CTAButton from '../components/ui/CTAButton.jsx'
import CountryOverviewSection from '../components/country/CountryOverviewSection.jsx'
import CountryLeadershipSection from '../components/country/CountryLeadershipSection.jsx'
import CountryChurchesInstitutionsSection from '../components/country/CountryChurchesInstitutionsSection.jsx'
import CountryMissionariesMinistriesSection from '../components/country/CountryMissionariesMinistriesSection.jsx'
import CountryNewsEventsSection from '../components/country/CountryNewsEventsSection.jsx'
import CountryContactSection from '../components/country/CountryContactSection.jsx'
import { getCountry, isHttpStatus } from '../services/api.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { titleCaseFromSlug } from '../lib/format.js'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'churches-institutions', label: 'Churches & Institutions' },
  { id: 'missionaries-ministries', label: 'Missionaries & Ministries' },
  { id: 'news-events', label: 'News & Events' },
  { id: 'contact', label: 'Contact' },
]

// The ONE reusable country page template (docs/PROJECT_SPEC.md §3, §5;
// Phase 5 instructions §4) — every country renders through this component,
// driven entirely by the `:continent`/`:country` route params and the
// existing Phase 3 public API. No per-country React files exist or may be
// added.
export default function CountryPage() {
  const { continent: continentSlug, country: countrySlug } = useParams()
  const [state, setState] = useState({ status: 'loading', country: null })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', country: null })

    getCountry(countrySlug)
      .then(({ data }) => {
        if (cancelled) return
        // A country that exists but belongs to a different continent than
        // the URL claims is an invalid hierarchy, not a valid page
        // (Phase 5 instructions §32) — never render it under the wrong
        // continent.
        if (data.continent?.slug !== continentSlug) {
          setState({ status: 'not-found', country: null })
          return
        }
        setState({ status: 'ready', country: data })
      })
      .catch((error) => {
        if (cancelled) return
        setState({ status: isHttpStatus(error, 404) ? 'not-found' : 'error', country: null })
      })

    return () => {
      cancelled = true
    }
  }, [continentSlug, countrySlug])

  useDocumentTitle(
    state.country
      ? `${state.country.name} | ${state.country.continent?.name ?? titleCaseFromSlug(continentSlug)} | World Wide Missions`
      : 'Mission Locations | World Wide Missions'
  )

  if (state.status === 'loading') {
    return (
      <SectionBand tone="white">
        <LoadingState label="Loading country…" />
      </SectionBand>
    )
  }

  if (state.status === 'not-found' || state.status === 'error') {
    return (
      <SectionBand tone="white">
        <EmptyState
          title={state.status === 'not-found' ? 'Country not found' : 'Something went wrong'}
          description={
            state.status === 'not-found'
              ? "This country isn't part of our published mission locations directory, or the URL doesn't match its continent."
              : 'We could not load this country right now. Please try again shortly.'
          }
        />
        <CTAButton to="/mission-locations" variant="tertiary" className="mt-6">
          Back to Mission Locations
        </CTAButton>
      </SectionBand>
    )
  }

  const { country } = state

  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[
            { label: 'Home', to: '/' },
            { label: 'Mission Locations', to: '/mission-locations' },
            { label: country.continent?.name ?? titleCaseFromSlug(continentSlug), to: `/mission-locations/${continentSlug}` },
            { label: country.name },
          ]}
          title={country.name}
          description={country.overview || undefined}
        />
      </SectionBand>

      <InPageNav items={SECTIONS} />

      <SectionBand tone="white" id="overview" className="scroll-mt-40">
        <CountryOverviewSection country={country} />
      </SectionBand>

      <SectionBand tone="light" id="leadership" className="scroll-mt-40">
        <SectionHeader title="Leadership" />
        <div className="mt-8">
          <CountryLeadershipSection countrySlug={country.slug} />
        </div>
      </SectionBand>

      <SectionBand tone="white" id="churches-institutions" className="scroll-mt-40">
        <SectionHeader title="Churches & Institutions" />
        <div className="mt-8">
          <CountryChurchesInstitutionsSection countrySlug={country.slug} />
        </div>
      </SectionBand>

      <SectionBand tone="light" id="missionaries-ministries" className="scroll-mt-40">
        <SectionHeader title="Missionaries & Ministries" />
        <div className="mt-8">
          <CountryMissionariesMinistriesSection countrySlug={country.slug} />
        </div>
      </SectionBand>

      <SectionBand tone="white" id="news-events" className="scroll-mt-40">
        <SectionHeader title="News & Events" />
        <div className="mt-8">
          <CountryNewsEventsSection countrySlug={country.slug} />
        </div>
      </SectionBand>

      <SectionBand tone="cream" id="contact" className="scroll-mt-40">
        <SectionHeader title="Contact" />
        <div className="mt-8">
          <CountryContactSection country={country} />
        </div>
      </SectionBand>
    </>
  )
}

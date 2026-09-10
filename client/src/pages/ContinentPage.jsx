import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import CTAButton from '../components/ui/CTAButton.jsx'
import ImagePlaceholder from '../components/ui/ImagePlaceholder.jsx'
import CountryCard from '../components/content/CountryCard.jsx'
import { getContinent, getCountriesByContinent, isHttpStatus } from '../services/api.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

// /mission-locations/:continent — reads the continent from the route,
// resolves it and its countries through the existing Continent/Country API
// (Phase 5 instructions §6). Countries render alphabetically because that is
// the public API's default sort (server/src/controllers/countryController.js).
export default function ContinentPage() {
  const { continent: continentSlug } = useParams()
  const [state, setState] = useState({ status: 'loading', continent: null, countries: [] })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', continent: null, countries: [] })

    getContinent(continentSlug)
      .then(({ data: continent }) =>
        getCountriesByContinent(continentSlug, { limit: 100 }).then(({ data: countries }) => {
          if (cancelled) return
          setState({ status: 'ready', continent, countries })
        })
      )
      .catch((error) => {
        if (cancelled) return
        setState({ status: isHttpStatus(error, 404) ? 'not-found' : 'error', continent: null, countries: [] })
      })

    return () => {
      cancelled = true
    }
  }, [continentSlug])

  useDocumentTitle(
    state.continent ? `${state.continent.name} | Mission Locations | World Wide Missions` : 'Mission Locations | World Wide Missions'
  )

  if (state.status === 'loading') {
    return (
      <SectionBand tone="white">
        <LoadingState label="Loading continent…" />
      </SectionBand>
    )
  }

  if (state.status === 'not-found' || state.status === 'error') {
    return (
      <SectionBand tone="white">
        <EmptyState
          title={state.status === 'not-found' ? 'Continent not found' : 'Something went wrong'}
          description={
            state.status === 'not-found'
              ? "This continent isn't part of our published mission locations directory."
              : 'We could not load this continent right now. Please try again shortly.'
          }
        />
        <CTAButton to="/mission-locations" variant="tertiary" className="mt-6">
          Back to Mission Locations
        </CTAButton>
      </SectionBand>
    )
  }

  const { continent, countries } = state

  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[
            { label: 'Home', to: '/' },
            { label: 'Mission Locations', to: '/mission-locations' },
            { label: continent.name },
          ]}
          title={continent.name}
          description={continent.description || undefined}
        />
      </SectionBand>

      <SectionBand tone="white">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.3fr]">
          <ImagePlaceholder label={`${continent.name} regional map`} ratio="aspect-square" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-wwm-neutral-600">Countries</p>
            <div className="mt-4">
              {countries.length === 0 ? (
                <EmptyState
                  title="No countries published yet"
                  description={`No countries are currently published for ${continent.name}.`}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {countries.map((country) => (
                    <CountryCard key={country.slug} country={country} />
                  ))}
                </div>
              )}
            </div>
            <CTAButton to="/mission-locations" variant="tertiary" className="mt-8">
              Back to Mission Locations
            </CTAButton>
          </div>
        </div>
      </SectionBand>
    </>
  )
}

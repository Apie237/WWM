import { useEffect, useState } from 'react'
import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import InPageNav from '../components/ui/InPageNav.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import DirectorySearch from '../components/content/DirectorySearch.jsx'
import OrganizationCard from '../components/content/OrganizationCard.jsx'
import { getCountries, getOrganizations } from '../services/api.js'

const SECTIONS = [
  { id: 'schools', label: 'Schools' },
  { id: 'hospitals-clinics', label: 'Hospitals & Clinics' },
  { id: 'orphanages', label: 'Orphanages' },
  { id: 'bible-colleges', label: 'Bible Colleges' },
  { id: 'skills-training', label: 'Skills Training' },
  { id: 'community-projects', label: 'Community Projects' },
]

// Matches the ORGANIZATION_TYPES enum (server/src/models/enums.js), minus
// wwm_church, which belongs to the Church Institutions directory instead.
const TYPE_OPTIONS = [
  { value: 'school', label: 'School' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'orphanage', label: 'Orphanage' },
  { value: 'bible_college', label: 'Bible College' },
  { value: 'training_center', label: 'Training Center' },
  { value: 'community_project', label: 'Community Project' },
  { value: 'other', label: 'Other' },
]

export default function NonChurchInstitutions() {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [type, setType] = useState('')
  const [countries, setCountries] = useState([])
  const [result, setResult] = useState({ loading: true, data: [] })

  useEffect(() => {
    getCountries({ limit: 100 })
      .then(({ data }) => setCountries(data))
      .catch(() => setCountries([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setResult((prev) => ({ ...prev, loading: true }))
    const params = { limit: 24 }
    if (type) params.type = type
    if (search.trim()) params.search = search.trim()
    if (country) params.country = country

    getOrganizations(params)
      .then(({ data }) => !cancelled && setResult({ loading: false, data: type ? data : data.filter((org) => org.type !== 'wwm_church') }))
      .catch(() => !cancelled && setResult({ loading: false, data: [] }))

    return () => {
      cancelled = true
    }
  }, [search, country, type])

  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Non-Church Institutions' }]}
          title="Non-Church Institutions"
          description="Schools, hospitals, clinics, and community projects extending care and opportunity worldwide."
        />
      </SectionBand>

      <InPageNav items={SECTIONS} />

      <SectionBand tone="white">
        <SectionHeader title="Institution Directory" />
        <div className="mt-6">
          <DirectorySearch
            search={search}
            onSearchChange={setSearch}
            country={country}
            onCountryChange={setCountry}
            countryOptions={countries}
            type={type}
            onTypeChange={setType}
            typeOptions={TYPE_OPTIONS}
          />
        </div>
        <div className="mt-8">
          {result.loading ? (
            <LoadingState label="Loading institutions…" />
          ) : result.data.length === 0 ? (
            <EmptyState
              title="No institutions found"
              description="No institutions match your search yet. Try a different search, or check back as our directory grows."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {result.data.map((organization) => (
                <OrganizationCard key={organization._id} organization={organization} />
              ))}
            </div>
          )}
        </div>
      </SectionBand>

      {SECTIONS.map((section) => (
        <SectionBand key={section.id} tone="light" id={section.id} className="scroll-mt-40">
          <SectionHeader title={section.label} />
        </SectionBand>
      ))}
    </>
  )
}

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
  { id: 'find-a-church', label: 'Find a Church' },
  { id: 'about', label: 'About Our Churches' },
  { id: 'network', label: 'Church Network' },
  { id: 'ministries', label: 'Ministries' },
  { id: 'resources', label: 'Resources' },
]

export default function ChurchInstitutions() {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
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
    const params = { type: 'wwm_church', limit: 24 }
    if (search.trim()) params.search = search.trim()
    if (country) params.country = country

    getOrganizations(params)
      .then(({ data }) => !cancelled && setResult({ loading: false, data }))
      .catch(() => !cancelled && setResult({ loading: false, data: [] }))

    return () => {
      cancelled = true
    }
  }, [search, country])

  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Church Institutions' }]}
          title="Church Institutions"
          description="Find a World Wide Missions church, learn about our church network, and explore church-based ministries."
        />
      </SectionBand>

      <InPageNav items={SECTIONS} />

      <SectionBand tone="white" id="find-a-church" className="scroll-mt-40">
        <SectionHeader title="Find a Church" />
        <div className="mt-6">
          <DirectorySearch
            search={search}
            onSearchChange={setSearch}
            country={country}
            onCountryChange={setCountry}
            countryOptions={countries}
          />
        </div>
        <div className="mt-8">
          {result.loading ? (
            <LoadingState label="Loading churches…" />
          ) : result.data.length === 0 ? (
            <EmptyState
              title="No churches found"
              description="No churches match your search yet. Try a different search, or check back as our directory grows."
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

      <SectionBand tone="light" id="about" className="scroll-mt-40">
        <SectionHeader
          title="About Our Churches"
          description="World Wide Missions churches share one statement of faith while serving the unique needs of their local communities."
        />
      </SectionBand>

      <SectionBand tone="white" id="network" className="scroll-mt-40">
        <SectionHeader
          title="Church Network"
          description="Our churches are connected through country administration and affiliate pastors boards."
        />
      </SectionBand>

      <SectionBand tone="light" id="ministries" className="scroll-mt-40">
        <SectionHeader title="Ministries" description="Explore the ministries active within our church network." />
      </SectionBand>

      <SectionBand tone="white" id="resources" className="scroll-mt-40">
        <SectionHeader title="Resources" description="Sermons, devotionals, and materials for local churches." />
      </SectionBand>
    </>
  )
}

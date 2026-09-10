import { useEffect, useState } from 'react'
import LoadingState from '../ui/LoadingState.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import DirectorySearch from '../content/DirectorySearch.jsx'
import OrganizationCard from '../content/OrganizationCard.jsx'
import { getOrganizations } from '../../services/api.js'

// Matches ORGANIZATION_TYPES (server/src/models/enums.js) exactly — the
// country page's Churches & Institutions group covers every organization
// type in one filterable directory, per docs/DESIGN_SPEC.md §5's grouping.
const TYPE_OPTIONS = [
  { value: 'wwm_church', label: 'WWM Church' },
  { value: 'school', label: 'School' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'orphanage', label: 'Orphanage' },
  { value: 'bible_college', label: 'Bible College' },
  { value: 'training_center', label: 'Training Center' },
  { value: 'community_project', label: 'Community Project' },
  { value: 'other', label: 'Other' },
]

// Churches & Institutions group of the country section navigation
// (docs/DESIGN_SPEC.md §5) — reuses DirectorySearch and OrganizationCard
// (already built in Phase 4) scoped to this country via the existing
// Organization API's `country` filter.
export default function CountryChurchesInstitutionsSection({ countrySlug }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [result, setResult] = useState({ loading: true, data: [] })

  useEffect(() => {
    let cancelled = false
    setResult((prev) => ({ ...prev, loading: true }))
    const params = { country: countrySlug, limit: 24 }
    if (type) params.type = type
    if (search.trim()) params.search = search.trim()

    getOrganizations(params)
      .then(({ data }) => !cancelled && setResult({ loading: false, data }))
      .catch(() => !cancelled && setResult({ loading: false, data: [] }))

    return () => {
      cancelled = true
    }
  }, [countrySlug, search, type])

  return (
    <div>
      <DirectorySearch
        search={search}
        onSearchChange={setSearch}
        type={type}
        onTypeChange={setType}
        typeOptions={TYPE_OPTIONS}
      />
      <div className="mt-8">
        {result.loading ? (
          <LoadingState label="Loading churches and institutions…" />
        ) : result.data.length === 0 ? (
          <EmptyState
            title="No organizations listed yet"
            description="No churches or institutions are currently listed for this country."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {result.data.map((organization) => (
              <OrganizationCard key={organization._id} organization={organization} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

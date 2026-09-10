import { useEffect, useState } from 'react'
import { Globe2, HandHeart, Landmark, Users } from 'lucide-react'
import SectionBand from '../ui/SectionBand.jsx'
import StatTile from '../ui/StatTile.jsx'
import { getContinents, getCountries, getOrganizations } from '../../services/api.js'

// Global mission highlights. Every figure shown here is a live count read
// from the API at render time — never a hardcoded statistic — per
// docs/PROJECT_SPEC.md §14 ("do not invent statistics"). A count of zero
// renders as an honest "not yet published" state rather than a fabricated
// number.
export default function StatsBand() {
  const [counts, setCounts] = useState({ continents: null, countries: null, organizations: null })

  useEffect(() => {
    let cancelled = false

    Promise.allSettled([getContinents(), getCountries({ limit: 1 }), getOrganizations({ limit: 1 })]).then(
      ([continents, countries, organizations]) => {
        if (cancelled) return
        setCounts({
          continents: continents.status === 'fulfilled' ? continents.value.data.length : null,
          countries: countries.status === 'fulfilled' ? countries.value.pagination.total : null,
          organizations: organizations.status === 'fulfilled' ? organizations.value.pagination.total : null,
        })
      }
    )

    return () => {
      cancelled = true
    }
  }, [])

  function countText(value, noun, pluralNoun) {
    if (value === null) return 'Directory data unavailable.'
    if (value === 0) return `Our ${pluralNoun} directory is being compiled.`
    return `${value} ${value === 1 ? noun : pluralNoun} currently listed in our directory.`
  }

  return (
    <SectionBand tone="navy">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Globe2}
          title="A Global Mission"
          description={countText(counts.continents, 'continent', 'continents')}
        />
        <StatTile icon={Landmark} title="A Rich Heritage" description="Continuing the work of the missionaries who came before us." />
        <StatTile
          icon={Users}
          title="Churches & Institutions"
          description={countText(counts.organizations, 'church or institution', 'churches and institutions')}
        />
        <StatTile icon={HandHeart} title="Partner With Us" description="Pray. Give. Go. Together we can change the world." />
      </div>
    </SectionBand>
  )
}

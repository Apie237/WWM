import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'

// Continent tile within the Mission Locations picker grid
// (docs/DESIGN_SPEC.md §14, §4) — driven entirely by Continent API data.
export default function ContinentCard({ continent, to = `/mission-locations/${continent.slug}` }) {
  return (
    <Link
      to={to}
      className="flex min-h-[44px] flex-col items-center gap-3 border border-wwm-neutral-300 bg-wwm-white px-4 py-6 text-center transition-colors hover:border-wwm-gold"
    >
      <Globe className="h-8 w-8 text-wwm-navy" aria-hidden="true" />
      <span className="text-sm font-bold uppercase tracking-wide text-wwm-navy">{continent.name}</span>
    </Link>
  )
}

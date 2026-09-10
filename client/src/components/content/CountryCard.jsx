import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

// Country tile within a continent's country list/grid (docs/DESIGN_SPEC.md
// §14, §25) — driven entirely by Country API data, never a per-country
// component. Countries returned from GET /continents/:slug/countries come
// with `continent` populated ({ name, slug }), so the link target is built
// from real API data rather than the current route param.
export default function CountryCard({ country }) {
  const continentSlug = country.continent?.slug
  const href = continentSlug ? `/mission-locations/${continentSlug}/${country.slug}` : '/mission-locations'

  return (
    <Link
      to={href}
      className="flex min-h-[44px] items-start gap-3 border border-wwm-neutral-300 bg-wwm-white px-4 py-3 transition-colors hover:border-wwm-gold"
    >
      {country.flagImageUrl ? (
        <img
          src={country.flagImageUrl}
          alt=""
          className="mt-0.5 h-5 w-7 shrink-0 border border-wwm-neutral-300 object-cover"
        />
      ) : (
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-wwm-navy" aria-hidden="true" />
      )}
      <span>
        <span className="block text-sm font-medium text-wwm-navy">{country.name}</span>
        {country.overview && (
          <span className="mt-0.5 line-clamp-2 block text-xs text-wwm-neutral-600">{country.overview}</span>
        )}
      </span>
    </Link>
  )
}

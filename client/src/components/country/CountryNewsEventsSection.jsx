import NewsEventsSection from '../resources/NewsEventsSection.jsx'

// News & Events group of the country section navigation
// (docs/DESIGN_SPEC.md §5): the shared site-wide News/Event cards, scoped to
// this country through the public API's `country` filter. Empty/error
// states are handled inside the shared section.
export default function CountryNewsEventsSection({ countrySlug }) {
  return <NewsEventsSection countrySlug={countrySlug} />
}

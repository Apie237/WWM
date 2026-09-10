import { Search } from 'lucide-react'
import SectionBand from '../ui/SectionBand.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import CTAButton from '../ui/CTAButton.jsx'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'

const LINKS = ['Find a Church', 'About Our Churches', 'Church Network', 'Ministries', 'Resources']

// Church Institutions discovery entry point (docs/DESIGN_SPEC.md §9). The
// location search is a visual shell only — implementing live search is
// explicitly deferred until it is reflected in docs/PROJECT_SPEC.md.
export default function ChurchInstitutionsBand() {
  return (
    <SectionBand tone="white" id="church-institutions-preview">
      <SectionHeader eyebrow="Home / Church Institutions" title="Church Institutions" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <ul className="space-y-2 border-wwm-neutral-300 lg:border-r lg:pr-6">
          {LINKS.map((label) => (
            <li key={label}>
              <span className="text-sm font-medium text-wwm-navy">{label}</span>
            </li>
          ))}
        </ul>
        <div>
          <form
            className="flex flex-col gap-2 border border-wwm-neutral-300 bg-wwm-bg p-4 sm:flex-row"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="church-search" className="sr-only">
              Find a World Wide Missions church near you
            </label>
            <input
              id="church-search"
              type="text"
              placeholder="Enter your city, state, or country"
              className="min-h-[44px] flex-1 border border-wwm-neutral-300 bg-wwm-white px-3 text-sm text-wwm-neutral-900 focus-visible:outline-2 focus-visible:outline-wwm-gold"
            />
            <button
              type="submit"
              className="flex min-h-[44px] items-center justify-center gap-2 bg-wwm-navy px-5 text-sm font-semibold uppercase tracking-wide text-wwm-white hover:bg-wwm-navy-light"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </button>
          </form>
          <ImagePlaceholder label="Church locations map" className="mt-4" ratio="aspect-[16/7]" />
          <CTAButton to="/church-institutions" variant="tertiary" className="mt-6">
            View All Churches
          </CTAButton>
        </div>
      </div>
    </SectionBand>
  )
}

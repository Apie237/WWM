import { Search } from 'lucide-react'

// Shared filter/search UI for the Church Institutions and Non-Church
// Institutions directories (docs/DESIGN_SPEC.md §9) — both query the same
// Organization API, differentiated only by which `typeOptions` are offered.
export default function DirectorySearch({ search, onSearchChange, country, onCountryChange, countryOptions, type, onTypeChange, typeOptions }) {
  return (
    <form
      className="flex flex-col gap-3 border border-wwm-neutral-300 bg-wwm-bg p-4 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="sm:flex-1 sm:min-w-[220px]">
        <label htmlFor="directory-search" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-wwm-neutral-600">
          Search by name
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wwm-neutral-600" aria-hidden="true" />
          <input
            id="directory-search"
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Enter a name"
            className="min-h-[44px] w-full border border-wwm-neutral-300 bg-wwm-white py-2 pl-9 pr-3 text-sm text-wwm-neutral-900 focus-visible:outline-2 focus-visible:outline-wwm-gold"
          />
        </div>
      </div>

      {typeOptions && (
        <div>
          <label htmlFor="directory-type" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-wwm-neutral-600">
            Type
          </label>
          <select
            id="directory-type"
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
            className="min-h-[44px] w-full border border-wwm-neutral-300 bg-wwm-white px-3 text-sm text-wwm-neutral-900 focus-visible:outline-2 focus-visible:outline-wwm-gold sm:w-52"
          >
            <option value="">All Types</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {countryOptions && (
        <div>
          <label htmlFor="directory-country" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-wwm-neutral-600">
            Country
          </label>
          <select
            id="directory-country"
            value={country}
            onChange={(event) => onCountryChange(event.target.value)}
            className="min-h-[44px] w-full border border-wwm-neutral-300 bg-wwm-white px-3 text-sm text-wwm-neutral-900 focus-visible:outline-2 focus-visible:outline-wwm-gold sm:w-52"
          >
            <option value="">All Countries</option>
            {countryOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </form>
  )
}

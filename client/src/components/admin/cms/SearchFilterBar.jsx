import { Search } from 'lucide-react'

// Search box + arbitrary filter controls (passed as children — a <select>
// per module's own filterable field) shown above every CMS list table.
export default function SearchFilterBar({ search, onSearchChange, placeholder = 'Search…', children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border border-wwm-neutral-300 bg-wwm-white p-3">
      <label className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-wwm-neutral-600" aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-wwm-neutral-300 py-2 pl-9 pr-3 text-sm text-wwm-neutral-900 focus-visible:outline-2 focus-visible:outline-wwm-gold"
        />
      </label>
      {children}
    </div>
  )
}

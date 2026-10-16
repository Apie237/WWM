import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import SearchFilterBar from './SearchFilterBar.jsx'
import DataTable from './DataTable.jsx'
import Pagination from './Pagination.jsx'

// Title + "add new" + search/filter bar + table + pager — the common shell
// every CMS list page (Continents, Countries, People, …) wraps around its
// own columns/filters, so the page itself only supplies module-specific
// pieces rather than re-laying out this chrome each time.
export default function ListPageShell({
  title,
  createTo,
  createLabel = 'Add New',
  canCreate = true,
  search,
  onSearchChange,
  searchPlaceholder,
  hideSearch = false,
  filters,
  columns,
  rows,
  status,
  actions,
  pagination,
  onPageChange,
  emptyTitle,
  emptyDescription,
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold uppercase tracking-wide text-wwm-navy">{title}</h1>
        {canCreate && (
          <Link
            to={createTo}
            className="inline-flex items-center gap-2 bg-wwm-gold px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-gold-light"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {createLabel}
          </Link>
        )}
      </div>

      {(!hideSearch || filters) && (
        <div className="mt-4">
          {hideSearch ? (
            <div className="flex flex-wrap items-center gap-3 border border-wwm-neutral-300 bg-wwm-white p-3">{filters}</div>
          ) : (
            <SearchFilterBar search={search} onSearchChange={onSearchChange} placeholder={searchPlaceholder}>
              {filters}
            </SearchFilterBar>
          )}
        </div>
      )}

      <div className="mt-4">
        <DataTable columns={columns} rows={rows} status={status} actions={actions} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
        {status === 'ready' && <Pagination pagination={pagination} onPageChange={onPageChange} />}
      </div>
    </div>
  )
}

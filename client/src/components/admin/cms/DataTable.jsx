import LoadingState from '../../ui/LoadingState.jsx'
import EmptyState from '../../ui/EmptyState.jsx'

// Generic admin list table. `columns`: [{ key, label, render?(row) }].
// `actions(row)` renders the trailing per-row action buttons (edit/delete
// links) so every module's list page shares one table shell instead of
// duplicating markup (docs/CLAUDE.md "reuse components ... avoid
// duplicating logic").
export default function DataTable({ columns, rows, status, emptyTitle = 'No records yet', emptyDescription, actions, getRowId = (row) => row._id }) {
  if (status === 'loading') return <LoadingState label="Loading records…" />
  if (status === 'error') {
    return <EmptyState title="Couldn't load records" description="Please try again, or refresh the page." />
  }
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto border border-wwm-neutral-300 bg-wwm-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-wwm-neutral-300 bg-wwm-neutral-100">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-wwm-navy">
                {col.label}
              </th>
            ))}
            {actions && <th scope="col" className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-xs text-wwm-navy">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)} className="border-b border-wwm-neutral-100 last:border-0 odd:bg-wwm-white even:bg-wwm-neutral-100/40">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-top text-wwm-neutral-900">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {actions && <td className="px-4 py-3 text-right align-top">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

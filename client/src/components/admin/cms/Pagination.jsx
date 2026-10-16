// Shared pager for every CMS list page. `pagination` is the server's
// { page, limit, total, pages } meta (server/src/utils/queryHelpers.js) —
// rendered as plain prev/next controls per docs/CLAUDE.md "avoid excessive
// animation/shadows/rounded cards".
export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null
  const { page, pages, total } = pagination

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-wwm-neutral-300 px-4 py-3 text-sm text-wwm-neutral-600">
      <span>
        Page {page} of {pages} &middot; {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="border border-wwm-neutral-300 px-3 py-1.5 font-semibold uppercase tracking-wide text-wwm-navy disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-wwm-neutral-100"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="border border-wwm-neutral-300 px-3 py-1.5 font-semibold uppercase tracking-wide text-wwm-navy disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-wwm-neutral-100"
        >
          Next
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Plus } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog.jsx'
import { errorMessage } from '../../../services/adminApi.js'

// One entry's delete button + its own confirm dialog. A 409 (other entries
// still report to this one — the server's cycle/child-reassignment guard)
// surfaces as the dialog's own error rather than a silent failure.
function RemoveEntryButton({ entry, entryNoun, onRemove }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    setBusy(true)
    setError(null)
    try {
      await onRemove(entry._id)
      setOpen(false)
    } catch (err) {
      setError(errorMessage(err, `Could not remove this ${entryNoun}.`))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-red-700 hover:text-red-900">
        Remove
      </button>
      <ConfirmDialog
        open={open}
        title={`Remove this ${entryNoun}?`}
        description={`This will permanently remove "${entry.title}". This cannot be undone.`}
        confirmLabel="Remove"
        busy={busy}
        error={error}
        onConfirm={handleConfirm}
        onCancel={() => {
          setOpen(false)
          setError(null)
        }}
      />
    </>
  )
}

// Shared read/edit view for a self-referencing hierarchy array
// (CountryAdministration.positions / AffiliatePastorsBoard.members — both
// use the same hierarchyEntry shape). Rendered as a flat table with a
// "Reports to" column rather than an indented tree, which keeps this one
// component usable for both modules without a client-side tree-layout
// algorithm; the relationship is still fully visible as text.
export default function HierarchyEntryList({ entries, entryNoun, onAdd, onEdit, onRemove, canWrite }) {
  const titleById = new Map(entries.map((e) => [String(e._id), e.title]))

  return (
    <div>
      <div className="overflow-x-auto border border-wwm-neutral-300 bg-wwm-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-wwm-neutral-300 bg-wwm-neutral-100">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-wwm-navy">Title</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-wwm-navy">Person</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-wwm-navy">Reports to</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-wwm-navy">Status</th>
              {canWrite && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-wwm-navy">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={canWrite ? 5 : 4} className="px-4 py-6 text-center text-wwm-neutral-600">
                  No {entryNoun}s added yet.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry._id} className="border-b border-wwm-neutral-100 last:border-0">
                <td className="px-4 py-3 align-top font-semibold text-wwm-navy">{entry.title}</td>
                <td className="px-4 py-3 align-top">{entry.person?.displayName || '—'}</td>
                <td className="px-4 py-3 align-top">{entry.parentEntry ? titleById.get(String(entry.parentEntry)) || '—' : '—'}</td>
                <td className="px-4 py-3 align-top">{entry.current ? 'Current' : 'Past'}</td>
                {canWrite && (
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex justify-end gap-3 text-sm font-semibold uppercase tracking-wide">
                      <button type="button" onClick={() => onEdit(entry)} className="text-wwm-navy hover:text-wwm-gold">
                        Edit
                      </button>
                      <RemoveEntryButton entry={entry} entryNoun={entryNoun} onRemove={onRemove} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canWrite && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 inline-flex items-center gap-2 border border-wwm-neutral-300 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-neutral-100"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add {entryNoun}
        </button>
      )}
    </div>
  )
}

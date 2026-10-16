import { useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from './ConfirmDialog.jsx'
import { errorMessage } from '../../../services/adminApi.js'

// Edit link + delete button (with its own confirm dialog) shared by every
// CMS list row. `onDelete` is an async adminApi `.remove(id)` call;
// `onDeleted` runs after a confirmed, successful delete (typically a list
// refresh). A 409 (dependent records still reference this one — the
// server's referential-integrity guard) surfaces as the dialog's own error
// rather than a silent failure.
export default function RowActions({ editTo, canEdit = true, canDelete = true, onDelete, onDeleted, itemLabel = 'this record' }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    setBusy(true)
    setError(null)
    try {
      await onDelete()
      setConfirmOpen(false)
      onDeleted?.()
    } catch (err) {
      setError(errorMessage(err, 'Could not delete this record.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex justify-end gap-3 text-sm font-semibold uppercase tracking-wide">
      {canEdit && (
        <Link to={editTo} className="text-wwm-navy hover:text-wwm-gold">
          Edit
        </Link>
      )}
      {canDelete && (
        <button type="button" onClick={() => setConfirmOpen(true)} className="text-red-700 hover:text-red-900">
          Delete
        </button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this record?"
        description={`This will permanently delete ${itemLabel}. This cannot be undone.`}
        busy={busy}
        error={error}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmOpen(false)
          setError(null)
        }}
      />
    </div>
  )
}

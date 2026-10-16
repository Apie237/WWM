// Delete-confirmation dialog shared by every CMS list page
// (docs/CLAUDE.md "delete confirmation dialogs"). A plain accessible modal —
// no animation/shadow per docs/DESIGN_SPEC.md.
export default function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', busy, error, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-wwm-neutral-900/60 px-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="w-full max-w-md border border-wwm-neutral-300 bg-wwm-white p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-wwm-navy">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-wwm-neutral-600">{description}</p>}
        {error && <p className="mt-3 border border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="border border-wwm-neutral-300 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-neutral-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="bg-red-700 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-white hover:bg-red-800 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

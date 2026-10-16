import { Link } from 'react-router-dom'
import Alert from './Alert.jsx'

// Shared create/edit form page shell: title, back link, error/success
// banner, and Save/Cancel actions — every CMS form page wraps its own
// fields with this instead of re-building the surrounding chrome.
export default function FormShell({ title, backTo, backLabel = 'Back to list', onSubmit, error, saving, children, submitLabel = 'Save' }) {
  return (
    <div className="mx-auto max-w-3xl">
      <Link to={backTo} className="text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold">
        &larr; {backLabel}
      </Link>
      <h1 className="mt-3 text-xl font-bold uppercase tracking-wide text-wwm-navy">{title}</h1>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5 border border-wwm-neutral-300 bg-wwm-white p-6">
        <Alert variant="error">{error}</Alert>
        {children}
        <div className="flex justify-end gap-3 border-t border-wwm-neutral-300 pt-4">
          <Link
            to={backTo}
            className="border border-wwm-neutral-300 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-neutral-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-wwm-gold px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-gold-light disabled:opacity-50"
          >
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

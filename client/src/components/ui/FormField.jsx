// Shared public-site form field (Prayer Request and Contact forms,
// docs/DESIGN_SPEC.md §11/§16: properly associated labels, non-color-only
// error messaging).
export const fieldClasses =
  'w-full border border-wwm-neutral-300 bg-wwm-white px-3 py-2.5 text-sm text-wwm-neutral-900 focus-visible:outline-2 focus-visible:outline-wwm-gold'

export default function FormField({ label, htmlFor, required, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-wwm-navy">
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-wwm-neutral-600">{hint}</p>}
    </div>
  )
}

// Result banner for a form submission (success or error), announced to AT.
export function FormStatus({ status, message }) {
  if (!message) return null
  const isError = status === 'error'
  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={`border px-4 py-3 text-sm ${isError ? 'border-red-700 bg-red-50 text-red-800' : 'border-wwm-navy bg-wwm-cream text-wwm-navy'}`}
    >
      {isError ? 'Error: ' : ''}
      {message}
    </p>
  )
}

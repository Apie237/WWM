// Label + input + validation-error wrapper shared by every CMS create/edit
// form field (docs/CLAUDE.md "form validation ... loading, error, and empty
// states"). Composes with a plain <input>/<select>/<textarea> passed as
// children so this file stays a thin layout primitive, not a form-control
// abstraction.
export default function FormField({ label, htmlFor, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-wwm-navy">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-wwm-neutral-600">{hint}</p>}
      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  )
}

export const inputClasses =
  'w-full border border-wwm-neutral-300 bg-wwm-white px-3 py-2 text-sm text-wwm-neutral-900 focus-visible:outline-2 focus-visible:outline-wwm-gold disabled:bg-wwm-neutral-100 disabled:text-wwm-neutral-600'

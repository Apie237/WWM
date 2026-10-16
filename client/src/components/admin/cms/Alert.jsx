// Success/error feedback banner shared by every CMS form/list page
// (docs/CLAUDE.md "Provide appropriate ... success, and error feedback").
const VARIANTS = {
  success: 'border-wwm-navy bg-wwm-cream text-wwm-navy',
  error: 'border-red-700 bg-red-50 text-red-800',
}

export default function Alert({ variant = 'error', children, onDismiss }) {
  if (!children) return null
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 border px-4 py-3 text-sm ${VARIANTS[variant]}`}>
      <span>{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss message" className="font-bold leading-none">
          &times;
        </button>
      )}
    </div>
  )
}

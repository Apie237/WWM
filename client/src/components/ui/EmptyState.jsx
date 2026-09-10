// Announced, real empty-state message rather than a blank region
// (docs/DESIGN_SPEC.md §16) — used whenever a section's API data hasn't been
// populated yet. Never fills the gap with invented content.
export default function EmptyState({ title = 'Nothing here yet', description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-2 border border-dashed border-wwm-neutral-300 bg-wwm-white/60 px-6 py-10 text-center">
      {Icon && <Icon className="h-6 w-6 text-wwm-neutral-600" aria-hidden="true" />}
      <p className="text-sm font-semibold text-wwm-navy">{title}</p>
      {description && <p className="max-w-md text-sm text-wwm-neutral-600">{description}</p>}
    </div>
  )
}

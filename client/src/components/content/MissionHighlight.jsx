// Mission-area tile: icon/small image + title + one-line description
// (docs/DESIGN_SPEC.md §10). Reused as a compact sidebar-style list item and,
// with the same underlying data, as an expanded card in a grid.
export default function MissionHighlight({ icon: Icon, title, description, layout = 'list' }) {
  if (layout === 'card') {
    return (
      <div className="flex flex-col gap-3 border border-wwm-neutral-300 bg-wwm-white p-6">
        <Icon className="h-6 w-6 text-wwm-navy" aria-hidden="true" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">{title}</h3>
        <p className="text-sm leading-relaxed text-wwm-neutral-600">{description}</p>
      </div>
    )
  }

  return (
    <li className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-wwm-gold" aria-hidden="true" />
      <span className="text-sm font-medium text-wwm-navy">{title}</span>
    </li>
  )
}

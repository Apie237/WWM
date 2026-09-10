// Icon + heading + short text tile, used in the homepage stats band and the
// Additional Features band (docs/DESIGN_SPEC.md §14). Icons always pair with
// a text label, per §1.6 — never icon-only.
export default function StatTile({ icon: Icon, title, description, tone = 'navy' }) {
  const isNavy = tone === 'navy'
  return (
    <div className="flex flex-col items-start gap-3 text-left">
      <span
        className={`inline-flex h-11 w-11 items-center justify-center border ${
          isNavy ? 'border-wwm-gold text-wwm-gold' : 'border-wwm-navy text-wwm-navy'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className={`text-sm font-bold uppercase tracking-wide ${isNavy ? 'text-wwm-white' : 'text-wwm-navy'}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${isNavy ? 'text-wwm-neutral-100' : 'text-wwm-neutral-600'}`}>
        {description}
      </p>
    </div>
  )
}

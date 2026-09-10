import Breadcrumbs from './Breadcrumbs.jsx'

// Breadcrumb + title pattern used atop every content card/page
// (docs/DESIGN_SPEC.md §14).
export default function SectionHeader({ eyebrow, title, description, crumbs, tone = 'light', className = '' }) {
  const isNavy = tone === 'navy'

  return (
    <div className={className}>
      {crumbs && <Breadcrumbs items={crumbs} tone={tone} />}
      {eyebrow && (
        <p
          className={`mt-3 text-xs font-semibold uppercase tracking-[0.2em] ${
            isNavy ? 'text-wwm-gold-light' : 'text-wwm-gold'
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`mt-2 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl ${
          isNavy ? 'text-wwm-white' : 'text-wwm-navy'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-3 max-w-2xl text-base leading-relaxed ${isNavy ? 'text-wwm-neutral-100' : 'text-wwm-neutral-600'}`}>
          {description}
        </p>
      )}
    </div>
  )
}

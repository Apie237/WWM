import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

// Semantic, ordered breadcrumb trail (docs/DESIGN_SPEC.md §16 accessible
// navigation requirement) — `items` is [{ label, to? }], last item is the
// current page (no link).
export default function Breadcrumbs({ items, tone = 'light' }) {
  const linkColor = tone === 'navy' ? 'text-wwm-neutral-100 hover:text-wwm-white' : 'text-wwm-neutral-600 hover:text-wwm-navy'
  const currentColor = tone === 'navy' ? 'text-wwm-white' : 'text-wwm-navy'

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />}
              {item.to && !isLast ? (
                <Link to={item.to} className={`transition-colors ${linkColor}`}>
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? `font-medium ${currentColor}` : linkColor} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

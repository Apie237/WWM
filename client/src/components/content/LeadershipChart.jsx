import { User } from 'lucide-react'
import { buildHierarchyTree } from '../../lib/hierarchy.js'
import EmptyState from '../ui/EmptyState.jsx'
import { imageSrc } from '../../lib/images.js'

// Generic, data-driven org-chart renderer shared by CountryAdministration
// and AffiliatePastorsBoard (docs/DESIGN_SPEC.md §6/§7) — no position titles
// or tier counts are hardcoded; everything renders from `entries`.
//
// The tree is a single semantic <ul>/<li> nesting so the hierarchy is
// exposed to assistive technology through real list structure, not just
// visual connector lines (docs/DESIGN_SPEC.md §16). Responsive Tailwind
// variants restyle that same DOM from a horizontal tiered tree (sm and up)
// into a vertical, indented, tier-grouped list (below sm) — the underlying
// data and markup never change, only the presentation (docs/DESIGN_SPEC.md
// §6's "Responsive behavior (FINAL)" rule).
export default function LeadershipChart({ entries, emptyTitle = 'No leadership structure published yet', emptyDescription }) {
  const tree = buildHierarchyTree(entries)

  if (tree.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto pb-2">
      <ChartTree nodes={tree} nested={false} />
    </div>
  )
}

function ChartTree({ nodes, nested }) {
  return (
    <ul
      className={`flex flex-col gap-3 sm:inline-flex sm:min-w-full sm:flex-row sm:items-start sm:justify-center sm:gap-8 ${
        nested
          ? 'border-l-2 border-wwm-neutral-300 pl-4 sm:border-0 sm:border-t-2 sm:border-wwm-navy sm:pl-0'
          : ''
      }`}
    >
      {nodes.map((node) => (
        <li key={node._id} className="sm:flex sm:flex-col sm:items-center">
          {nested && <div className="hidden h-5 w-px bg-wwm-navy sm:block" aria-hidden="true" />}
          <NodeBox entry={node} />
          {node.children.length > 0 && (
            <div className="mt-3 sm:mt-0 sm:flex sm:flex-col sm:items-center">
              <div className="hidden h-5 w-px bg-wwm-navy sm:block" aria-hidden="true" />
              <ChartTree nodes={node.children} nested />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function NodeBox({ entry }) {
  return (
    <div className="flex min-w-[200px] items-center gap-3 border border-wwm-neutral-300 bg-wwm-white px-3 py-2 sm:min-w-[150px] sm:max-w-[170px] sm:flex-col sm:items-center sm:gap-1 sm:border-wwm-navy sm:bg-wwm-navy sm:px-4 sm:py-3 sm:text-center">
      {entry.person?.photoUrl ? (
        <img
          src={imageSrc(entry.person.photoUrl, 96)}
          loading="lazy"
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wwm-neutral-100 text-wwm-neutral-600 sm:h-10 sm:w-10 sm:bg-white/10 sm:text-wwm-white">
          <User className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <span>
        <p className="text-xs font-bold uppercase tracking-wide text-wwm-navy sm:text-wwm-white">{entry.title}</p>
        {entry.person?.displayName && (
          <p className="text-xs text-wwm-neutral-600 sm:text-wwm-neutral-100">{entry.person.displayName}</p>
        )}
        {entry.current === false && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-wwm-neutral-600 sm:text-wwm-gold-light">
            Former
          </p>
        )}
      </span>
    </div>
  )
}

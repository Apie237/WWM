import SectionHeader from './SectionHeader.jsx'
import EmptyState from './EmptyState.jsx'

// Shared shell for a page subsection whose approved content hasn't been
// supplied/verified yet. Renders a real, announced empty state rather than
// leaving a blank region (docs/DESIGN_SPEC.md §16) and never fills the gap
// with invented organizational content (docs/PROJECT_SPEC.md §14).
export default function PlaceholderSection({ id, title, note }) {
  return (
    <div id={id} className="scroll-mt-40 border-t border-wwm-neutral-300 py-10 first:border-none first:pt-0">
      <SectionHeader title={title} />
      <div className="mt-5">
        <EmptyState
          title="Content pending"
          description={note ?? `${title} content will be published here once approved organizational information is available.`}
        />
      </div>
    </div>
  )
}

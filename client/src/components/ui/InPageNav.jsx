import Container from './Container.jsx'

// Sticky in-page section nav for long editorial pages (About, Missions,
// Church/Non-Church Institutions, Resources). Collapses to a horizontally
// scrollable strip rather than shrinking illegibly on mobile
// (docs/DESIGN_SPEC.md §13's "restructure, don't shrink" principle).
export default function InPageNav({ items }) {
  return (
    <nav aria-label="Page sections" className="sticky top-[64px] z-30 border-b border-wwm-neutral-300 bg-wwm-white sm:top-[128px]">
      <Container>
        <ul className="flex gap-6 overflow-x-auto py-3 [scrollbar-width:thin]">
          {items.map((item) => (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                className="block min-h-[44px] px-1 py-2 text-xs font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  )
}

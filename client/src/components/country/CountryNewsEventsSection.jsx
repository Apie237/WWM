import { Newspaper } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'

// News & Events group of the country section navigation. News and Event
// content models belong to Phase 8 (docs/PROJECT_SPEC.md §6, "content models
// (later phases)") and no API exists for them yet — this renders the
// required deferred-content state rather than any fabricated content.
export default function CountryNewsEventsSection() {
  return (
    <EmptyState
      icon={Newspaper}
      title="No news or events published yet"
      description="Country-specific news and events will appear here once that content system is built."
    />
  )
}

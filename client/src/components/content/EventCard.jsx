import { Link } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { formatDateRange } from '../../lib/format.js'

// Event list item: date, title, location, link (docs/DESIGN_SPEC.md §11).
export default function EventCard({ item }) {
  return (
    <article className="border border-wwm-neutral-300 bg-wwm-white p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-wwm-gold">
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        {formatDateRange(item.startDate, item.endDate)}
      </p>
      <h3 className="mt-2 text-base font-bold text-wwm-navy">
        <Link to={`/events/${item.slug}`} className="hover:text-wwm-gold focus-visible:outline-2 focus-visible:outline-wwm-gold">
          {item.title}
        </Link>
      </h3>
      {(item.location || item.country?.name) && (
        <p className="mt-2 flex items-start gap-2 text-sm text-wwm-neutral-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{[item.location, item.country?.name].filter(Boolean).join(', ')}</span>
        </p>
      )}
      <Link to={`/events/${item.slug}`} className="mt-4 inline-block text-xs font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold">
        Event details
      </Link>
    </article>
  )
}

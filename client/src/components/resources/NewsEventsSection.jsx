import { Link } from 'react-router-dom'
import { Newspaper, CalendarDays } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import LoadingState from '../ui/LoadingState.jsx'
import NewsCard from '../content/NewsCard.jsx'
import EventCard from '../content/EventCard.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getNews, getEvents } from '../../services/api.js'

// Latest news + upcoming events. Used site-wide (no countrySlug) on
// /resources and scoped to one country on the reusable CountryPage template.
export default function NewsEventsSection({ countrySlug, limit = 3 }) {
  const scope = countrySlug ? { country: countrySlug } : {}
  const news = useFetch(getNews, { ...scope, limit })
  const events = useFetch(getEvents, { ...scope, when: 'upcoming', limit })
  const suffix = countrySlug ? `?country=${encodeURIComponent(countrySlug)}` : ''

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-end justify-between gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Latest News</h3>
          <Link to={`/news${suffix}`} className="text-xs font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold">
            View all news
          </Link>
        </div>
        <div className="mt-5">
          {news.status === 'loading' ? (
            <LoadingState label="Loading news…" />
          ) : news.status === 'error' ? (
            <EmptyState icon={Newspaper} title="News could not be loaded" description="Please try again later." />
          ) : news.data.length === 0 ? (
            <EmptyState icon={Newspaper} title="No news published yet" description="Mission updates will be published here." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.data.map((item) => (
                <NewsCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-wwm-neutral-300 pt-10">
        <div className="flex items-end justify-between gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Upcoming Events</h3>
          <Link to={`/events${suffix}`} className="text-xs font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold">
            View all events
          </Link>
        </div>
        <div className="mt-5">
          {events.status === 'loading' ? (
            <LoadingState label="Loading events…" />
          ) : events.status === 'error' ? (
            <EmptyState icon={CalendarDays} title="Events could not be loaded" description="Please try again later." />
          ) : events.data.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming events" description="Upcoming events will be published here." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.data.map((item) => (
                <EventCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

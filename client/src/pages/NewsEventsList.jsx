import { useSearchParams } from 'react-router-dom'
import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import NewsCard from '../components/content/NewsCard.jsx'
import EventCard from '../components/content/EventCard.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { getNews, getEvents } from '../services/api.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { titleCaseFromSlug } from '../lib/format.js'

const PAGE_SIZE = 12

// One list template for /news and /events (kind = 'news' | 'events'),
// optionally scoped by ?country=<slug> and paged by ?page=.
export default function NewsEventsList({ kind }) {
  const isNews = kind === 'news'
  const [params, setParams] = useSearchParams()
  const country = params.get('country') || undefined
  const rawPage = Number(params.get('page'))
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const when = !isNews ? (params.get('when') === 'past' ? 'past' : 'upcoming') : undefined

  const query = { country, page, limit: PAGE_SIZE, ...(when ? { when } : {}) }
  const { status, data, pagination } = useFetch(isNews ? getNews : getEvents, query)

  const title = isNews ? 'News' : 'Events'
  useDocumentTitle(`${title} | World Wide Missions`)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Resources', to: '/resources#news-events' }, { label: title }]}
          title={country ? `${title} — ${titleCaseFromSlug(country)}` : title}
          description={isNews ? 'Mission updates from World Wide Missions.' : 'Upcoming and past World Wide Missions events.'}
        />
      </SectionBand>

      <SectionBand tone="white">
        {!isNews && (
          <div className="mb-8 flex gap-3" role="group" aria-label="Event timing">
            {['upcoming', 'past'].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={when === value}
                onClick={() => setParam('when', value === 'upcoming' ? null : value)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide ${when === value ? 'bg-wwm-navy text-wwm-white' : 'border border-wwm-neutral-300 text-wwm-navy hover:bg-wwm-neutral-100'}`}
              >
                {value}
              </button>
            ))}
          </div>
        )}

        {status === 'loading' ? (
          <LoadingState label={`Loading ${kind}…`} />
        ) : status === 'error' ? (
          <EmptyState title={`${title} could not be loaded`} description="Please try again later." />
        ) : data.length === 0 ? (
          <EmptyState title={`No ${kind} found`} description={`Published ${kind} will appear here.`} />
        ) : (
          <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${isNews ? 'lg:grid-cols-3' : 'lg:grid-cols-3'}`}>
            {data.map((item) => (isNews ? <NewsCard key={item._id} item={item} /> : <EventCard key={item._id} item={item} />))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-between text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))} className="border border-wwm-neutral-300 px-4 py-2 font-semibold uppercase tracking-wide text-wwm-navy disabled:opacity-40">
              Previous
            </button>
            <span className="text-wwm-neutral-600">Page {pagination.page} of {pagination.pages}</span>
            <button type="button" disabled={page >= pagination.pages} onClick={() => setParam('page', String(page + 1))} className="border border-wwm-neutral-300 px-4 py-2 font-semibold uppercase tracking-wide text-wwm-navy disabled:opacity-40">
              Next
            </button>
          </nav>
        )}
      </SectionBand>
    </>
  )
}

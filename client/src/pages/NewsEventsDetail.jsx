import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import ImagePlaceholder from '../components/ui/ImagePlaceholder.jsx'
import { getNewsItem, getEvent, isHttpStatus } from '../services/api.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatDate, formatDateRange, toParagraphs } from '../lib/format.js'

// One detail template for /news/:slug and /events/:slug.
export default function NewsEventsDetail({ kind }) {
  const isNews = kind === 'news'
  const { slug } = useParams()
  const [state, setState] = useState({ status: 'loading', item: null })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', item: null })
    ;(isNews ? getNewsItem : getEvent)(slug)
      .then(({ data }) => !cancelled && setState({ status: 'ready', item: data }))
      .catch((err) => !cancelled && setState({ status: isHttpStatus(err, 404) ? 'not-found' : 'error', item: null }))
    return () => {
      cancelled = true
    }
  }, [slug, isNews])

  const { status, item } = state
  const listLabel = isNews ? 'News' : 'Events'
  useDocumentTitle(item ? `${item.title} | World Wide Missions` : `${listLabel} | World Wide Missions`)

  if (status === 'loading') return <SectionBand tone="white"><LoadingState label="Loading…" /></SectionBand>
  if (status !== 'ready') {
    return (
      <SectionBand tone="white">
        <EmptyState
          title={status === 'not-found' ? `${isNews ? 'Article' : 'Event'} not found` : 'Could not be loaded'}
          description={status === 'not-found' ? 'It may have been removed or is not published.' : 'Please try again later.'}
        />
        <p className="mt-6 text-center"><Link className="text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold" to={`/${kind}`}>Back to {listLabel}</Link></p>
      </SectionBand>
    )
  }

  const body = toParagraphs(isNews ? item.body : item.description)

  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[{ label: 'Home', to: '/' }, { label: listLabel, to: `/${kind}` }, { label: item.title }]}
          title={item.title}
          description={isNews ? [formatDate(item.publishedAt), item.country?.name].filter(Boolean).join(' · ') : undefined}
        />
      </SectionBand>

      <SectionBand tone="white">
        <article className="mx-auto max-w-3xl">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="mb-8 w-full object-cover" />
          ) : (
            <ImagePlaceholder label="Photo coming soon" ratio="aspect-[16/7]" className="mb-8" />
          )}
          {!isNews && (
            <ul className="mb-6 space-y-2 text-sm text-wwm-neutral-900">
              <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-wwm-gold" aria-hidden="true" />{formatDateRange(item.startDate, item.endDate)}</li>
              {(item.location || item.country?.name) && (
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-wwm-gold" aria-hidden="true" />{[item.location, item.country?.name].filter(Boolean).join(', ')}</li>
              )}
            </ul>
          )}
          {body.length === 0 ? (
            <p className="text-sm text-wwm-neutral-600">No further details have been published.</p>
          ) : (
            body.map((p, i) => <p key={i} className="mb-5 whitespace-pre-line text-base leading-relaxed text-wwm-neutral-900">{p}</p>)
          )}
          <Link to={`/${kind}`} className="mt-6 inline-block text-xs font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold">&larr; All {listLabel.toLowerCase()}</Link>
        </article>
      </SectionBand>
    </>
  )
}

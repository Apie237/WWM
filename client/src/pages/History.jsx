import { useEffect, useMemo, useState } from 'react'
import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import InPageNav from '../components/ui/InPageNav.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import HistoryFeature from '../components/history/HistoryFeature.jsx'
import LeadershipTimeline from '../components/history/LeadershipTimeline.jsx'
import HistoricalRecords from '../components/history/HistoricalRecords.jsx'
import Reveal from '../components/history/Reveal.jsx'
import { getHistory } from '../services/api.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { toParagraphs } from '../lib/format.js'

const NAV = [
  { id: 'origins', label: 'Origins' },
  { id: 'cameroon', label: 'Cameroon' },
  { id: 'cameroon-leadership', label: 'Leadership' },
  { id: 'international-leadership', label: 'International leadership' },
  { id: 'international-growth', label: 'Growth' },
  { id: 'records', label: 'Historical records' },
]

const RECORDS_NOTICE =
  'These are historical details supplied by the founder. They are not presented as current addresses or as a statement of current legal status unless separately confirmed.'
const LEADERSHIP_NOTE =
  'Dates and the order of succession are shown only as supplied. A complete list of appointments has not been published.'

// Every historical statement on this page comes from HistoryEvent records
// (Admin → History); this file only decides how each section is laid out.
export default function History() {
  useDocumentTitle('Our History | World Wide Missions')
  const [state, setState] = useState({ status: 'loading', items: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getHistory({ limit: 200 })
      .then(({ data }) => !cancelled && setState({ status: 'ready', items: data }))
      .catch(() => !cancelled && setState({ status: 'error', items: [] }))
    return () => {
      cancelled = true
    }
  }, [attempt])

  const by = useMemo(() => {
    const groups = {}
    for (const item of state.items) (groups[item.section] ||= []).push(item)
    return groups
  }, [state.items])

  const intro = by.introduction?.[0]
  const nav = NAV.filter((n) => by[n.id]?.length)

  return (
    <>
      <SectionBand tone="navy" className="py-12 sm:py-16">
        <SectionHeader
          tone="navy"
          crumbs={[{ label: 'Home', to: '/' }, { label: 'About Us', to: '/about' }, { label: 'Our History' }]}
          eyebrow="Heritage"
          title="Our History"
        />
        {intro && (
          <div className="mt-5 max-w-3xl space-y-3 text-base leading-relaxed text-wwm-neutral-100 sm:text-lg">
            {toParagraphs(intro.description).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </SectionBand>

      {state.status === 'loading' && (
        <SectionBand tone="white">
          <LoadingState label="Loading our history…" />
        </SectionBand>
      )}

      {state.status === 'error' && (
        <SectionBand tone="white">
          <EmptyState title="Our history could not be loaded" description="Please check your connection and try again." />
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setState({ status: 'loading', items: [] })
                setAttempt((n) => n + 1)
              }}
              className="border border-wwm-navy px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-navy hover:text-wwm-white"
            >
              Try again
            </button>
          </div>
        </SectionBand>
      )}

      {state.status === 'ready' && state.items.length === 0 && (
        <SectionBand tone="white">
          <EmptyState title="Our history is being compiled" description="Historical entries will appear here once they are published." />
        </SectionBand>
      )}

      {state.status === 'ready' && state.items.length > 0 && (
        <>
          {nav.length > 0 && <InPageNav items={nav} />}

          {by.origins && (
            <SectionBand tone="white" id="origins" className="scroll-mt-40">
              <Reveal><SectionHeader eyebrow="International origins" title="Where the story begins" /></Reveal>
              <div className="mt-10 space-y-16">
                {by.origins.map((e, i) => (
                  <HistoryFeature key={e._id} entry={e} reverse={i % 2 === 1} />
                ))}
              </div>
            </SectionBand>
          )}

          {by.cameroon && (
            <SectionBand tone="cream" id="cameroon" className="scroll-mt-40">
              <Reveal><SectionHeader eyebrow="Mission history" title="The mission in Cameroon" /></Reveal>
              <div className="mt-10">
                <HistoryFeature entry={by.cameroon[0]} large />
              </div>
              {by.cameroon.length > 1 && (
                <ol className="mt-14 grid gap-6 border-t border-wwm-neutral-300 pt-10 md:grid-cols-2">
                  {by.cameroon.slice(1).map((e) => (
                    <Reveal as="li" key={e._id} className="list-none border-l-2 border-wwm-gold bg-wwm-white p-6">
                      {e.dateLabel && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wwm-gold">{e.dateLabel}</p>}
                      <h3 className="mt-1 text-lg font-bold text-wwm-navy">{e.title}</h3>
                      {e.location && <p className="text-sm text-wwm-neutral-600">{e.location}</p>}
                      <p className="mt-3 text-base leading-relaxed text-wwm-neutral-900">{e.description}</p>
                      {e.source && <p className="mt-3 text-xs text-wwm-neutral-600">Source: {e.source}</p>}
                    </Reveal>
                  ))}
                </ol>
              )}
            </SectionBand>
          )}

          {by['cameroon-leadership'] && (
            <SectionBand tone="white" id="cameroon-leadership" className="scroll-mt-40">
              <Reveal><SectionHeader eyebrow="World Wide Missions Cameroon" title="Leadership in Cameroon" /></Reveal>
              <div className="mt-10">
                <LeadershipTimeline entries={by['cameroon-leadership']} note={LEADERSHIP_NOTE} />
              </div>
            </SectionBand>
          )}

          {by['international-leadership'] && (
            <SectionBand tone="cream" id="international-leadership" className="scroll-mt-40">
              <Reveal><SectionHeader eyebrow="International administration" title="International leadership" /></Reveal>
              <div className="mt-10 space-y-16">
                {by['international-leadership'].map((e, i) => (
                  <HistoryFeature key={e._id} entry={e} reverse={i % 2 === 1} />
                ))}
              </div>
            </SectionBand>
          )}

          {by['international-growth'] && (
            <SectionBand tone="white" id="international-growth" className="scroll-mt-40">
              <Reveal><SectionHeader eyebrow="Beyond Cameroon" title="International growth" /></Reveal>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {by['international-growth'].map((e) =>
                  e.entryType === 'pending' ? (
                    <Reveal as="article" key={e._id} className="border border-dashed border-wwm-neutral-300 bg-wwm-neutral-100 p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wwm-neutral-600">Information to come</p>
                      <h3 className="mt-2 text-lg font-bold text-wwm-navy">{e.title}</h3>
                      <p className="mt-3 text-base leading-relaxed text-wwm-neutral-600">{e.description}</p>
                    </Reveal>
                  ) : (
                    <Reveal as="article" key={e._id} className="border-l-2 border-wwm-gold bg-wwm-bg p-6">
                      {e.dateLabel && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wwm-gold">{e.dateLabel}</p>}
                      <h3 className="mt-1 text-lg font-bold text-wwm-navy">{e.title}</h3>
                      <p className="mt-3 text-base leading-relaxed text-wwm-neutral-900">{e.description}</p>
                      {e.source && <p className="mt-3 text-xs text-wwm-neutral-600">Source: {e.source}</p>}
                    </Reveal>
                  ),
                )}
              </div>
            </SectionBand>
          )}

          {by.records && (
            <SectionBand tone="cream" id="records" className="scroll-mt-40">
              <Reveal><SectionHeader eyebrow="Archive" title="Historical records" /></Reveal>
              <div className="mt-8">
                <HistoricalRecords entries={by.records} notice={RECORDS_NOTICE} />
              </div>
            </SectionBand>
          )}
        </>
      )}
    </>
  )
}

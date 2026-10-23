import { Archive } from 'lucide-react'
import EntryPhoto from './EntryPhoto.jsx'
import Reveal from './Reveal.jsx'

// Restrained panel for historical addresses and the authorization statement.
// Text is shown exactly as stored (line breaks preserved) and is always
// framed as historical — never as a current address or a legal conclusion.
export default function HistoricalRecords({ entries, notice }) {
  return (
    <div>
      {notice && (
        <p className="flex max-w-3xl items-start gap-2 border-l-2 border-wwm-gold bg-wwm-white/70 px-4 py-3 text-sm leading-relaxed text-wwm-neutral-900">
          <Archive className="mt-0.5 h-4 w-4 shrink-0 text-wwm-navy" aria-hidden="true" />
          {notice}
        </p>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {entries.map((entry) => (
          <Reveal as="article" key={entry._id} className="border border-wwm-neutral-300 bg-wwm-white p-6">
            <EntryPhoto entry={entry} variant="record" ownOnly />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wwm-gold">
              {entry.dateLabel || 'Historical record'}
            </p>
            <h3 className="mt-2 text-base font-bold text-wwm-navy">{entry.title}</h3>
            {entry.description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-wwm-neutral-900">{entry.description}</p>
            )}
            {entry.source && <p className="mt-4 text-xs text-wwm-neutral-600">Source: {entry.source}</p>}
          </Reveal>
        ))}
      </div>
    </div>
  )
}

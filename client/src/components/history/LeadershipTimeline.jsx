import { User } from 'lucide-react'
import { entryImage, placeholderLabel } from '../../lib/history.js'
import HistoryImage from './HistoryImage.jsx'
import Reveal from './Reveal.jsx'

// Left column of every timeline row. Photo and no-photo rows share the same
// column width so the text always starts at the same place; the photograph is
// shown whole (not cropped to a tiny square), the no-photo icon stays small.
const COLUMN = 'min-[420px]:w-40 sm:w-48 lg:w-56 shrink-0'

function Portrait({ entry }) {
  const image = entryImage(entry)
  const icon = (
    <div className="flex h-24 w-24 items-center justify-center overflow-hidden border border-wwm-neutral-300 bg-wwm-neutral-100 text-wwm-neutral-600 sm:h-32 sm:w-32">
      <span role="img" aria-label={placeholderLabel(entry)}>
        <User className="h-10 w-10" aria-hidden="true" />
      </span>
    </div>
  )
  return (
    <div className={COLUMN}>
      <HistoryImage image={image} variant="portrait" fallback={icon} />
    </div>
  )
}

// Vertical succession timeline. One column on every screen size: a gold rail
// on the left, a marker per entry, a photograph column (10–14rem wide from
// phone-landscape up) with the text beside it, stacking the photo above the
// text only on very narrow screens, so nothing is squeezed or scrolled
// sideways on mobile. Entries appear in the stored order and no
// dates or succession are inferred beyond what each entry states.
export default function LeadershipTimeline({ entries, note }) {
  return (
    <div>
      <ol className="relative ml-3 border-l-2 border-wwm-gold sm:ml-4">
        {entries.map((entry) => (
          <li key={entry._id} className="relative pb-10 pl-6 last:pb-0 sm:pl-10">
            <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-wwm-gold bg-wwm-white" aria-hidden="true" />
            <Reveal className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:gap-6 sm:gap-8">
              <Portrait entry={entry} />
              <div className="min-w-0">
                {entry.dateLabel && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wwm-gold">{entry.dateLabel}</p>}
                <h3 className="mt-1 text-lg font-bold text-wwm-navy sm:text-xl">{entry.title}</h3>
                {entry.subtitle && <p className="text-sm font-semibold uppercase tracking-wide text-wwm-neutral-600">{entry.subtitle}</p>}
                {entry.description && <p className="mt-2 max-w-xl text-base leading-relaxed text-wwm-neutral-900">{entry.description}</p>}
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
      {note && <p className="mt-8 max-w-2xl text-sm italic text-wwm-neutral-600">{note}</p>}
    </div>
  )
}

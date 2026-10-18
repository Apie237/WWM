import { useState } from 'react'
import { User } from 'lucide-react'
import { imageSrc } from '../../lib/images.js'
import { entryImage, placeholderLabel } from '../../lib/history.js'
import Reveal from './Reveal.jsx'

function Portrait({ entry }) {
  const image = entryImage(entry)
  const [broken, setBroken] = useState(false)
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-wwm-neutral-300 bg-wwm-neutral-100 text-wwm-neutral-600 sm:h-32 sm:w-32">
      {image && !broken ? (
        <img
          src={imageSrc(image.url, 300)}
          alt={image.alt}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <span role="img" aria-label={placeholderLabel(entry)}>
          <User className="h-10 w-10" aria-hidden="true" />
        </span>
      )}
    </div>
  )
}

// Vertical succession timeline. One column on every screen size: a gold rail
// on the left, a marker per entry, photograph + text beside it (stacking the
// photo above the text only on very narrow screens), so nothing is squeezed
// or scrolled sideways on mobile. Entries appear in the stored order and no
// dates or succession are inferred beyond what each entry states.
export default function LeadershipTimeline({ entries, note }) {
  return (
    <div>
      <ol className="relative ml-3 border-l-2 border-wwm-gold sm:ml-4">
        {entries.map((entry) => (
          <li key={entry._id} className="relative pb-10 pl-6 last:pb-0 sm:pl-10">
            <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-wwm-gold bg-wwm-white" aria-hidden="true" />
            <Reveal className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:gap-6">
              <Portrait entry={entry} />
              <div>
                {entry.dateLabel && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wwm-gold">{entry.dateLabel}</p>}
                <h3 className="mt-1 text-lg font-bold text-wwm-navy sm:text-xl">{entry.title}</h3>
                {entry.subtitle && <p className="text-sm font-semibold uppercase tracking-wide text-wwm-neutral-600">{entry.subtitle}</p>}
                {entry.description && <p className="mt-2 max-w-xl text-base leading-relaxed text-wwm-neutral-900">{entry.description}</p>}
                {entry.source && <p className="mt-2 text-xs text-wwm-neutral-600">Source: {entry.source}</p>}
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
      {note && <p className="mt-8 max-w-2xl text-sm italic text-wwm-neutral-600">{note}</p>}
    </div>
  )
}

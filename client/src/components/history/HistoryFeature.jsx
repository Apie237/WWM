import { useState } from 'react'
import { MapPin } from 'lucide-react'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'
import { imageSrc, imageSrcSet } from '../../lib/images.js'
import { entryImage, placeholderLabel } from '../../lib/history.js'
import { toParagraphs } from '../../lib/format.js'
import Reveal from './Reveal.jsx'

// A single history entry presented as a photograph beside its text. Used for
// the origins, Cameroon and international-leadership features. Images keep
// their frame proportions (fixed aspect box, object-cover) so portraits and
// group photos neither stretch nor shift the layout while loading; a missing
// or broken image falls back to a labelled placeholder.
export default function HistoryFeature({ entry, reverse = false, large = false }) {
  const image = entryImage(entry)
  const [broken, setBroken] = useState(false)
  const paragraphs = toParagraphs(entry.description)
  // A photograph slot (image or labelled placeholder) is shown only for entries
  // that have a photo or are meant to have one (alt text/caption set in the CMS);
  // other entries read as text so the page isn't filled with empty frames.
  const wantsPhoto = Boolean(image || entry.imageAlt || entry.imageCaption)

  return (
    <Reveal className={`grid items-center gap-8 lg:gap-14 ${wantsPhoto ? (large ? 'lg:grid-cols-[1.1fr_1fr]' : 'lg:grid-cols-2') : 'max-w-3xl'}`}>
      {wantsPhoto && (
      <figure className={reverse ? 'lg:order-2' : ''}>
        {image && !broken ? (
          <img
            src={imageSrc(image.url, 800)}
            srcSet={imageSrcSet(image.url, [480, 800, 1200])}
            sizes="(min-width: 1024px) 560px, 100vw"
            alt={image.alt}
            loading="lazy"
            onError={() => setBroken(true)}
            className={`w-full border border-wwm-neutral-300 bg-wwm-white object-cover object-top ${large ? 'aspect-[4/3]' : 'aspect-[4/3]'}`}
          />
        ) : (
          <ImagePlaceholder label={placeholderLabel(entry)} />
        )}
        {entry.imageCaption && image && !broken && (
          <figcaption className="mt-2 text-xs text-wwm-neutral-600">{entry.imageCaption}</figcaption>
        )}
      </figure>
      )}

      <div>
        {entry.dateLabel && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wwm-gold">
            {entry.approximateDate ? `c. ${entry.dateLabel}` : entry.dateLabel}
          </p>
        )}
        <h3 className={`mt-2 font-extrabold text-wwm-navy ${large ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>{entry.title}</h3>
        {entry.subtitle && <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-wwm-neutral-600">{entry.subtitle}</p>}
        <div className="mt-4 space-y-3 text-base leading-relaxed text-wwm-neutral-900">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {entry.location && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-wwm-neutral-600">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {entry.location}
          </p>
        )}
        {entry.source && <p className="mt-3 text-xs text-wwm-neutral-600">Source: {entry.source}</p>}
      </div>
    </Reveal>
  )
}

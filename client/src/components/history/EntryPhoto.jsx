import { useState } from 'react'
import { imageSrc, imageSrcSet } from '../../lib/images.js'
import { entryImage } from '../../lib/history.js'

// Photograph for the compact history cards (secondary Cameroon milestones and
// international-growth entries). Unlike HistoryFeature it shows nothing at all
// when there is no usable photograph, so cards without one are unchanged.
export default function EntryPhoto({ entry }) {
  const image = entryImage(entry)
  const [broken, setBroken] = useState(false)
  if (!image || broken) return null
  return (
    <figure className="mb-4">
      <img
        src={imageSrc(image.url, 600)}
        srcSet={imageSrcSet(image.url, [400, 600, 900])}
        sizes="(min-width: 768px) 480px, 100vw"
        alt={image.alt}
        loading="lazy"
        onError={() => setBroken(true)}
        className="aspect-[4/3] w-full border border-wwm-neutral-300 bg-wwm-white object-cover object-top"
      />
      {entry.imageCaption && <figcaption className="mt-2 text-xs text-wwm-neutral-600">{entry.imageCaption}</figcaption>}
    </figure>
  )
}

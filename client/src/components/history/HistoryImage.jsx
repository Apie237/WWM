import { useState } from 'react'
import { imageSrc, imageSrcSet } from '../../lib/images.js'
import { HISTORY_IMAGE_VARIANTS } from '../../lib/historyImage.js'

// The one way History photographs are framed. Every variant shows the WHOLE
// photograph (object-contain — historical and archival photos must not lose
// edges, faces or captions to a crop) at its natural proportions: the frame is
// as tall as the picture needs, up to a per-variant ceiling, and any spare room
// is filled with a quiet neutral mat. Portrait, landscape and square images
// therefore all sit correctly without stretching.
//
// `fallback` is rendered when there is no image or it fails to load (a labelled
// placeholder for features, nothing at all for compact cards), so a missing
// picture never leaves an empty frame.
//
export default function HistoryImage({ image, variant = 'feature', caption, fallback = null }) {
  const [broken, setBroken] = useState(false)
  const v = HISTORY_IMAGE_VARIANTS[variant]
  if (!image || broken) return fallback

  return (
    <figure className={v.frame}>
      <div className="overflow-hidden border border-wwm-neutral-300 bg-wwm-neutral-100 p-1.5 sm:p-2">
        <img
          src={imageSrc(image.url, v.src)}
          srcSet={imageSrcSet(image.url, v.widths)}
          sizes={v.sizes}
          alt={image.alt}
          loading="lazy"
          onError={() => setBroken(true)}
          className={`mx-auto block h-auto w-full object-contain object-center ${v.img}`}
        />
      </div>
      {caption && <figcaption className="mt-2 text-xs leading-relaxed text-wwm-neutral-600">{caption}</figcaption>}
    </figure>
  )
}

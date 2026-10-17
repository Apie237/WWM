import { User } from 'lucide-react'
import { formatLifeDates } from '../../lib/format.js'
import { imageSrc } from '../../lib/images.js'

// Founder/pioneer variant of PersonCard — archival-style portrait framing,
// life dates, short bio excerpt (docs/DESIGN_SPEC.md §8, §14). Rendered
// entirely from Person API records; no historical figure is hardcoded here.
export default function PioneerCard({ person }) {
  const lifeDates = formatLifeDates(person.lifeDates)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden border border-wwm-neutral-300 bg-wwm-white text-wwm-neutral-600 sm:h-32 sm:w-32">
        {person.photoUrl ? (
          <img src={imageSrc(person.photoUrl, 400)} alt={person.displayName} loading="lazy" className="h-full w-full object-cover grayscale" />
        ) : (
          <User className="h-12 w-12" aria-hidden="true" />
        )}
      </div>
      <div>
        <p className="text-lg font-bold text-wwm-navy">{person.displayName}</p>
        {lifeDates && <p className="text-sm text-wwm-neutral-600">{lifeDates}</p>}
        {person.biography && <p className="mt-2 max-w-md text-sm leading-relaxed text-wwm-neutral-900">{person.biography}</p>}
      </div>
    </div>
  )
}

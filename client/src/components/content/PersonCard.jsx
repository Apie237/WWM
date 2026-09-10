import { User } from 'lucide-react'
import { formatEnumLabel } from '../../lib/format.js'

// Generic person display reused for leadership, pastors, missionaries
// (docs/DESIGN_SPEC.md §14) — never a bespoke component per named
// individual. `roleLabel` lets the caller pick which of a person's possibly
// multiple roles (docs/PROJECT_SPEC.md §7) is relevant in the current
// context; falls back to the person's first recorded role.
export default function PersonCard({ person, roleLabel, frame = 'circle' }) {
  const fallbackRole = person.roles?.[0]
  const label = roleLabel ?? (fallbackRole?.title || formatEnumLabel(fallbackRole?.roleType))

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`flex h-24 w-24 items-center justify-center overflow-hidden border border-wwm-neutral-300 bg-wwm-neutral-100 text-wwm-neutral-600 ${
          frame === 'circle' ? 'rounded-full' : ''
        }`}
      >
        {person.photoUrl ? (
          <img src={person.photoUrl} alt={person.displayName} className="h-full w-full object-cover" />
        ) : (
          <User className="h-10 w-10" aria-hidden="true" />
        )}
      </div>
      <p className="mt-3 text-sm font-bold text-wwm-navy">{person.displayName}</p>
      {label && <p className="text-xs uppercase tracking-wide text-wwm-neutral-600">{label}</p>}
    </div>
  )
}

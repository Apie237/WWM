import { Building2 } from 'lucide-react'
import { formatEnumLabel } from '../../lib/format.js'

// Church/institution display, filtered by `type` at the query level — one
// component for both Church Institutions and Non-Church Institutions
// directories (docs/PROJECT_SPEC.md §8, docs/DESIGN_SPEC.md §9).
export default function OrganizationCard({ organization }) {
  return (
    <div className="flex flex-col border border-wwm-neutral-300 bg-wwm-white">
      <div className="flex aspect-[4/3] items-center justify-center bg-wwm-neutral-100 text-wwm-neutral-600">
        <Building2 className="h-8 w-8" aria-hidden="true" />
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-wwm-gold">
          {formatEnumLabel(organization.type)}
        </p>
        <p className="mt-1 text-sm font-bold text-wwm-navy">{organization.name}</p>
        {organization.country?.name && (
          <p className="mt-1 text-xs text-wwm-neutral-600">
            {organization.location?.city ? `${organization.location.city}, ` : ''}
            {organization.country.name}
          </p>
        )}
      </div>
    </div>
  )
}

import { Mail, MapPin, Phone } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'

// Contact group of the country section navigation (docs/DESIGN_SPEC.md §5) —
// renders only fields actually present on the Country record's `contact`
// sub-document. Never falls back to the historical Pasadena/global address
// (docs/PROJECT_SPEC.md §12) or any invented phone/email/address.
export default function CountryContactSection({ country }) {
  const contact = country.contact || {}
  const hasContact = contact.headquartersAddress || contact.mailingAddress || contact.phone || contact.email

  if (!hasContact) {
    return (
      <EmptyState
        icon={MapPin}
        title="Contact information not yet published"
        description="Country contact information has not yet been published."
      />
    )
  }

  return (
    <ul className="space-y-3 text-sm text-wwm-neutral-900">
      {contact.headquartersAddress && (
        <li className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-wwm-gold" aria-hidden="true" />
          <span>{contact.headquartersAddress}</span>
        </li>
      )}
      {contact.mailingAddress && (
        <li className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-wwm-gold" aria-hidden="true" />
          <span>Mailing: {contact.mailingAddress}</span>
        </li>
      )}
      {contact.phone && (
        <li className="flex items-center gap-3">
          <Phone className="h-4 w-4 shrink-0 text-wwm-gold" aria-hidden="true" />
          <span>{contact.phone}</span>
        </li>
      )}
      {contact.email && (
        <li className="flex items-center gap-3">
          <Mail className="h-4 w-4 shrink-0 text-wwm-gold" aria-hidden="true" />
          <span>{contact.email}</span>
        </li>
      )}
    </ul>
  )
}

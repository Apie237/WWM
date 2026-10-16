import { formatDate } from '../../lib/format.js'

// Approved public prayer request: short text + date. A name appears only when
// the submitter opted in (the API already omits it otherwise).
export default function PrayerRequestCard({ item }) {
  return (
    <article className="border border-wwm-neutral-300 bg-wwm-white p-5">
      <p className="whitespace-pre-line text-sm leading-relaxed text-wwm-neutral-900">{item.request}</p>
      <p className="mt-3 text-xs uppercase tracking-wide text-wwm-neutral-600">
        {item.name || 'Anonymous'}
        {item.country?.name ? ` · ${item.country.name}` : ''}
        {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ''}
      </p>
    </article>
  )
}

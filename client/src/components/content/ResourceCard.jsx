import { Download, FileText, Headphones, Video } from 'lucide-react'
import { RESOURCE_TYPE_LABELS } from '../../lib/format.js'

const ICONS = { audio: Headphones, video: Video, document: Download, publication: FileText }

// Resource-library item (docs/DESIGN_SPEC.md §11): title, type, description,
// external view/download link. The URL is validated http(s) server-side.
export default function ResourceCard({ item }) {
  const Icon = ICONS[item.resourceType] || FileText
  return (
    <article className="flex flex-col border border-wwm-neutral-300 bg-wwm-white p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-wwm-gold">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {RESOURCE_TYPE_LABELS[item.resourceType] || 'Resource'}
      </p>
      <h3 className="mt-2 text-base font-bold text-wwm-navy">{item.title}</h3>
      {item.description && <p className="mt-2 text-sm leading-relaxed text-wwm-neutral-600">{item.description}</p>}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-xs font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold"
      >
        Open resource<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </article>
  )
}

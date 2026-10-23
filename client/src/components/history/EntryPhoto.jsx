import { entryImage } from '../../lib/history.js'
import HistoryImage from './HistoryImage.jsx'

// Photograph for the compact history cards (secondary Cameroon milestones,
// international-growth entries) and the records archive. Shows nothing at all
// when there is no usable photograph, so cards without one are unchanged.
// `ownOnly` (records) ignores a linked person's portrait: a document record
// should only ever show a picture uploaded for that record itself.
export default function EntryPhoto({ entry, variant = 'card', ownOnly = false }) {
  const image = ownOnly ? (entry.imageUrl ? { url: entry.imageUrl, alt: entry.imageAlt || entry.title } : null) : entryImage(entry)
  if (!image) return null
  return (
    <div className="mb-4">
      <HistoryImage image={image} variant={variant} caption={entry.imageCaption} />
    </div>
  )
}

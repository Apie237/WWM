import { Link } from 'react-router-dom'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'
import { formatDate } from '../../lib/format.js'
import { imageSrc, imageSrcSet } from '../../lib/images.js'

// News list/grid item (docs/DESIGN_SPEC.md §11): image, title, date, excerpt, link.
export default function NewsCard({ item }) {
  return (
    <article className="flex flex-col border border-wwm-neutral-300 bg-wwm-white">
      {item.imageUrl ? (
        <img src={imageSrc(item.imageUrl, 640)} srcSet={imageSrcSet(item.imageUrl, [320, 640, 960])} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
      ) : (
        <ImagePlaceholder label="Photo coming soon" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-wwm-gold">
          {formatDate(item.publishedAt)}
          {item.country?.name ? ` · ${item.country.name}` : ''}
        </p>
        <h3 className="mt-2 text-base font-bold text-wwm-navy">
          <Link to={`/news/${item.slug}`} className="hover:text-wwm-gold focus-visible:outline-2 focus-visible:outline-wwm-gold">
            {item.title}
          </Link>
        </h3>
        {item.summary && <p className="mt-2 text-sm leading-relaxed text-wwm-neutral-600">{item.summary}</p>}
        <Link to={`/news/${item.slug}`} className="mt-4 text-xs font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold">
          Read more
        </Link>
      </div>
    </article>
  )
}

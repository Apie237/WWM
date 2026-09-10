import { DollarSign, FileText, MapPinned, Megaphone, Newspaper, Users } from 'lucide-react'
import SectionBand from '../ui/SectionBand.jsx'
import StatTile from '../ui/StatTile.jsx'
import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: Newspaper, title: 'News & Events', description: 'Latest mission updates and events.', to: '/resources#news-events' },
  { icon: Megaphone, title: 'Prayer Requests', description: 'Submit and view prayer needs.', to: '/resources#prayer-requests' },
  { icon: Users, title: 'Missionaries', description: 'Meet our missionaries and their stories.', to: '/missions#missionaries' },
  { icon: FileText, title: 'Resources', description: 'Sermons, devotionals, tracts, and more.', to: '/resources#resources' },
  { icon: DollarSign, title: 'Give Online', description: 'Support the mission securely.', to: '/resources#give' },
  { icon: MapPinned, title: 'Contact Us', description: 'Get in touch with us worldwide.', to: '/resources#contact' },
]

export default function AdditionalFeaturesBand() {
  return (
    <SectionBand tone="navy" className="py-12 sm:py-14">
      <h2 className="mb-8 text-center text-sm font-bold uppercase tracking-[0.2em] text-wwm-gold-light">
        Additional Features
      </h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Link key={feature.title} to={feature.to} className="focus-visible:outline-2 focus-visible:outline-wwm-gold">
            <StatTile icon={feature.icon} title={feature.title} description={feature.description} />
          </Link>
        ))}
      </div>
    </SectionBand>
  )
}

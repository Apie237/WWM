import { BookOpen, Church, GraduationCap, HeartHandshake, Newspaper, ShieldCheck, Sprout } from 'lucide-react'
import SectionBand from '../ui/SectionBand.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import CTAButton from '../ui/CTAButton.jsx'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'
import MissionHighlight from '../content/MissionHighlight.jsx'

// Mirrors the MINISTRY_TYPES classification already defined server-side
// (server/src/models/enums.js) — these are activity categories, not
// invented statistics (docs/DESIGN_SPEC.md §10).
const MISSION_AREAS = [
  { icon: Church, title: 'Church Planting' },
  { icon: Sprout, title: 'Evangelism' },
  { icon: GraduationCap, title: 'Leadership Training' },
  { icon: BookOpen, title: 'Education' },
  { icon: HeartHandshake, title: 'Compassion Ministries' },
  { icon: Newspaper, title: 'Media & Publications' },
  { icon: ShieldCheck, title: 'Missionary Care' },
]

export default function MissionsBand() {
  return (
    <SectionBand tone="light" id="mission-areas">
      <SectionHeader eyebrow="Home / Missions" title="Missions" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr_1.2fr]">
        <ul>
          {MISSION_AREAS.map((area) => (
            <MissionHighlight key={area.title} icon={area.icon} title={area.title} />
          ))}
        </ul>
        <ImagePlaceholder label="Mission field photograph" />
        <div>
          <p className="text-base leading-relaxed text-wwm-neutral-600">
            We are committed to taking the Gospel to the nations and equipping believers to impact their world.
          </p>
          <CTAButton to="/missions" variant="tertiary" className="mt-6">
            View All Missions
          </CTAButton>
        </div>
      </div>
    </SectionBand>
  )
}

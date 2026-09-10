import { useEffect, useState } from 'react'
import { BookOpen, Church, GraduationCap, HeartHandshake, Newspaper, ShieldCheck, Sprout } from 'lucide-react'
import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import InPageNav from '../components/ui/InPageNav.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import CTAButton from '../components/ui/CTAButton.jsx'
import MissionHighlight from '../components/content/MissionHighlight.jsx'
import PersonCard from '../components/content/PersonCard.jsx'
import { getMinistries, getPeople } from '../services/api.js'

const SECTIONS = [
  { id: 'mission-areas', label: 'Mission Areas' },
  { id: 'missionaries', label: 'Missionaries' },
  { id: 'ministries', label: 'Ministries' },
  { id: 'where-we-serve', label: 'Where We Serve' },
]

const MISSION_AREAS = [
  { icon: Church, title: 'Church Planting', description: 'Establishing new congregations in unreached communities.' },
  { icon: Sprout, title: 'Evangelism', description: 'Sharing the Gospel across nations and cultures.' },
  { icon: GraduationCap, title: 'Leadership Training', description: 'Equipping pastors and national leaders.' },
  { icon: BookOpen, title: 'Education', description: 'Schools and training centers building for the future.' },
  { icon: HeartHandshake, title: 'Compassion Ministries', description: 'Meeting practical needs with the love of Christ.' },
  { icon: Newspaper, title: 'Media & Publications', description: 'Producing Christian literature and media.' },
  { icon: ShieldCheck, title: 'Missionary Care', description: 'Supporting the well-being of missionaries in the field.' },
]

export default function Missions() {
  const [missionaries, setMissionaries] = useState({ loading: true, data: [] })
  const [ministries, setMinistries] = useState({ loading: true, data: [] })

  useEffect(() => {
    let cancelled = false
    getPeople({ role: 'missionary', limit: 12 })
      .then(({ data }) => !cancelled && setMissionaries({ loading: false, data }))
      .catch(() => !cancelled && setMissionaries({ loading: false, data: [] }))
    getMinistries({ limit: 20 })
      .then(({ data }) => !cancelled && setMinistries({ loading: false, data }))
      .catch(() => !cancelled && setMinistries({ loading: false, data: [] }))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Missions' }]}
          title="Missions"
          description="We are committed to taking the Gospel to the nations and equipping believers to impact their world."
        />
      </SectionBand>

      <InPageNav items={SECTIONS} />

      <SectionBand tone="white" id="mission-areas" className="scroll-mt-40">
        <SectionHeader title="Mission Areas" />
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MISSION_AREAS.map((area) => (
            <MissionHighlight key={area.title} layout="card" {...area} />
          ))}
        </div>
      </SectionBand>

      <SectionBand tone="light" id="missionaries" className="scroll-mt-40">
        <SectionHeader title="Missionaries" description="Meet our missionaries and their stories." />
        <div className="mt-8">
          {missionaries.loading ? (
            <LoadingState label="Loading missionaries…" />
          ) : missionaries.data.length === 0 ? (
            <EmptyState
              title="Missionary directory coming soon"
              description="Missionary profiles will appear here once they are added to the directory."
            />
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-6">
              {missionaries.data.map((person) => (
                <PersonCard key={person._id} person={person} />
              ))}
            </div>
          )}
        </div>
      </SectionBand>

      <SectionBand tone="white" id="ministries" className="scroll-mt-40">
        <SectionHeader title="Ministries" />
        <div className="mt-8">
          {ministries.loading ? (
            <LoadingState label="Loading ministries…" />
          ) : ministries.data.length === 0 ? (
            <EmptyState
              title="Ministry directory coming soon"
              description="Active ministries will appear here once they are added to the directory."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ministries.data.map((ministry) => (
                <div key={ministry._id} className="border border-wwm-neutral-300 p-5">
                  <p className="text-sm font-bold text-wwm-navy">{ministry.name}</p>
                  {ministry.description && (
                    <p className="mt-2 text-sm leading-relaxed text-wwm-neutral-600">{ministry.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionBand>

      <SectionBand tone="cream" id="where-we-serve" className="scroll-mt-40">
        <SectionHeader
          title="Where We Serve"
          description="Explore the countries and regions where World Wide Missions is active."
        />
        <CTAButton to="/mission-locations" variant="tertiary" className="mt-6">
          View Mission Locations
        </CTAButton>
      </SectionBand>
    </>
  )
}

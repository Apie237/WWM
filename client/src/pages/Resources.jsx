import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import InPageNav from '../components/ui/InPageNav.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import NewsEventsSection from '../components/resources/NewsEventsSection.jsx'
import ResourceLibrarySection from '../components/resources/ResourceLibrarySection.jsx'
import PrayerRequestsSection from '../components/resources/PrayerRequestsSection.jsx'
import ContactSection from '../components/resources/ContactSection.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { DollarSign } from 'lucide-react'

const SECTIONS = [
  { id: 'news-events', label: 'News & Events' },
  { id: 'resources', label: 'Resources' },
  { id: 'prayer-requests', label: 'Prayer Requests' },
  { id: 'give', label: 'Give' },
  { id: 'contact', label: 'Contact' },
]

// Phase 8: News & Events, the resource library, Prayer Requests, and Contact
// are live (database-driven via the public API). Give remains an honest
// placeholder: no payment provider or verified giving details have been
// supplied, so nothing is invented here.
export default function Resources() {
  useDocumentTitle('Resources | World Wide Missions')
  return (
    <>
      <SectionBand tone="navy" className="py-12">
        <SectionHeader
          tone="navy"
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Resources' }]}
          title="Resources"
          description="News, events, prayer requests, downloadable resources, giving, and ways to get in touch."
        />
      </SectionBand>

      <InPageNav items={SECTIONS} />

      <SectionBand tone="white" id="news-events" className="scroll-mt-40">
        <SectionHeader title="News & Events" />
        <div className="mt-8">
          <NewsEventsSection />
        </div>
      </SectionBand>

      <SectionBand tone="light" id="resources" className="scroll-mt-40">
        <SectionHeader title="Resources" />
        <div className="mt-6">
          <ResourceLibrarySection />
        </div>
      </SectionBand>

      <SectionBand tone="white" id="prayer-requests" className="scroll-mt-40">
        <SectionHeader title="Prayer Requests" />
        <div className="mt-8">
          <PrayerRequestsSection />
        </div>
      </SectionBand>

      <SectionBand tone="cream" id="give" className="scroll-mt-40">
        <SectionHeader title="Give" description="Support the mission securely." />
        <div className="mt-6">
          <EmptyState icon={DollarSign} title="Online giving is not available yet" description="Official giving options will be published here once the organization confirms them." />
        </div>
      </SectionBand>

      <SectionBand tone="white" id="contact" className="scroll-mt-40">
        <SectionHeader title="Contact" />
        <div className="mt-8">
          <ContactSection />
        </div>
      </SectionBand>
    </>
  )
}

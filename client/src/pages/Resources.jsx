import SectionBand from '../components/ui/SectionBand.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import InPageNav from '../components/ui/InPageNav.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { Newspaper, DollarSign, FileText, MapPinned, Megaphone } from 'lucide-react'

const SECTIONS = [
  { id: 'news-events', label: 'News & Events' },
  { id: 'resources', label: 'Resources' },
  { id: 'prayer-requests', label: 'Prayer Requests' },
  { id: 'give', label: 'Give' },
  { id: 'contact', label: 'Contact' },
]

// Shell for News & Events, Resources, Prayer Requests, Give, and Contact —
// all of these belong to Phase 8 ("Remaining Public Modules") once their
// content models exist. Phase 4 provides the reusable page structure and
// navigation entry point only (Phase 4 instructions, "Public Routes").
export default function Resources() {
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
        <div className="mt-6">
          <EmptyState
            icon={Newspaper}
            title="No news or events yet"
            description="Mission updates and upcoming events will be published here."
          />
        </div>
      </SectionBand>

      <SectionBand tone="light" id="resources" className="scroll-mt-40">
        <SectionHeader title="Resources" />
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title="No resources published yet"
            description="Sermons, devotionals, tracts, and downloads will appear here."
          />
        </div>
      </SectionBand>

      <SectionBand tone="white" id="prayer-requests" className="scroll-mt-40">
        <SectionHeader title="Prayer Requests" />
        <div className="mt-6">
          <EmptyState
            icon={Megaphone}
            title="Prayer request submissions coming soon"
            description="A form to submit and view public prayer requests will be added here."
          />
        </div>
      </SectionBand>

      <SectionBand tone="cream" id="give" className="scroll-mt-40">
        <SectionHeader title="Give" description="Support the mission securely." />
        <div className="mt-6">
          <EmptyState icon={DollarSign} title="Online giving coming soon" description="A secure giving option will be added here." />
        </div>
      </SectionBand>

      <SectionBand tone="white" id="contact" className="scroll-mt-40">
        <SectionHeader title="Contact" />
        <div className="mt-6">
          <EmptyState
            icon={MapPinned}
            title="Contact details coming soon"
            description="Verified contact information will be published here once confirmed."
          />
        </div>
      </SectionBand>
    </>
  )
}

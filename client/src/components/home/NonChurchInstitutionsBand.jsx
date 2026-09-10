import SectionBand from '../ui/SectionBand.jsx'
import SectionHeader from '../ui/SectionHeader.jsx'
import CTAButton from '../ui/CTAButton.jsx'
import ImagePlaceholder from '../ui/ImagePlaceholder.jsx'

const CATEGORIES = ['Schools', 'Hospitals & Clinics', 'Orphanages', 'Bible Colleges', 'Skills Training', 'Community Projects']

export default function NonChurchInstitutionsBand() {
  return (
    <SectionBand tone="light" id="non-church-institutions-preview">
      <SectionHeader eyebrow="Home / Non-Church Institutions" title="Non-Church Institutions" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr_1fr]">
        <ul className="space-y-2 border-wwm-neutral-300 lg:border-r lg:pr-6">
          {CATEGORIES.map((label) => (
            <li key={label}>
              <span className="text-sm font-medium text-wwm-navy">{label}</span>
            </li>
          ))}
        </ul>
        <ImagePlaceholder label="Institution photograph" />
        <div>
          <p className="text-base leading-relaxed text-wwm-neutral-600">
            Schools, hospitals, clinics, and community projects extending care and opportunity to the communities we
            serve.
          </p>
          <CTAButton to="/non-church-institutions" variant="tertiary" className="mt-6">
            View All Institutions
          </CTAButton>
        </div>
      </div>
    </SectionBand>
  )
}

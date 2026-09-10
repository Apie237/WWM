import HeroSection from '../content/HeroSection.jsx'
import CTAButton from '../ui/CTAButton.jsx'

export default function HeroBand() {
  return (
    <HeroSection
      eyebrow="World Wide Missions International"
      title="Reaching Nations. Transforming Lives. Fulfilling the Great Commission."
      quote="Go ye therefore, and teach all nations…"
      quoteCitation="Matthew 28:19"
      primaryCta={
        <CTAButton to="/missions" variant="primary">
          Our Mission
        </CTAButton>
      }
      secondaryCta={
        <CTAButton to="/mission-locations" variant="secondary">
          Where We Serve
        </CTAButton>
      }
    />
  )
}

import Container from './Container.jsx'

const BACKGROUNDS = {
  light: 'bg-wwm-bg text-wwm-neutral-900',
  white: 'bg-wwm-white text-wwm-neutral-900',
  navy: 'bg-wwm-navy text-wwm-white',
  cream: 'bg-wwm-cream text-wwm-neutral-900',
}

// Full-width background wrapper for homepage/section layout rhythm
// (docs/DESIGN_SPEC.md §14, §15.9). Banding itself is the primary visual
// separator between sections — no border/shadow dividers between bands.
export default function SectionBand({ tone = 'white', className = '', containerClassName = '', children, id }) {
  return (
    <section id={id} className={`${BACKGROUNDS[tone]} py-14 sm:py-16 lg:py-20 ${className}`}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}

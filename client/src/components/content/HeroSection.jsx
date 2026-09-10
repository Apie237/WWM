import Container from '../ui/Container.jsx'

// Full-bleed hero with dark overlay for legible white text
// (docs/DESIGN_SPEC.md §1.8, §3). No real mission photography has been
// supplied yet, so the background falls back to a restrained navy gradient
// rather than a stock/fabricated photo — swap in a real `backgroundImage`
// once Cloudinary-backed photography lands (Phase 9).
export default function HeroSection({ eyebrow, title, quote, quoteCitation, primaryCta, secondaryCta, backgroundImage }) {
  return (
    <div
      className="relative flex min-h-[560px] items-center overflow-hidden bg-wwm-navy sm:min-h-[620px]"
      style={
        backgroundImage
          ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {
              backgroundImage:
                'radial-gradient(ellipse at top right, rgba(18,53,102,0.9), transparent 60%), linear-gradient(160deg, #0a1f3c 0%, #0a1f3c 55%, #071630 100%)',
            }
      }
    >
      <div className="absolute inset-0 bg-wwm-navy/40" aria-hidden="true" />
      <Container className="relative py-20">
        <div className="max-w-2xl">
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.3em] text-wwm-gold-light">{eyebrow}</p>}
          <h1 className="mt-4 text-3xl font-extrabold uppercase leading-tight tracking-wide text-wwm-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {quote && (
            <blockquote className="mt-6 border-l-2 border-wwm-gold pl-4 italic text-wwm-neutral-100">
              <p className="text-base sm:text-lg">&ldquo;{quote}&rdquo;</p>
              {quoteCitation && <cite className="mt-1 block text-sm not-italic text-wwm-gold-light">{quoteCitation}</cite>}
            </blockquote>
          )}
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryCta}
              {secondaryCta}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

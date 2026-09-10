import logoUrl from '../../assets/logo.55'

// The real WWM logo asset (client/src/assets/logo.55, actually an animated
// WebP — see vite.config.js for how it's imported/built despite the
// non-standard extension) is a complete circular emblem with "WORLD WIDE
// MISSIONS INTERNATIONAL" already lettered into the artwork itself. A
// separate text wordmark is still shown alongside it (per the project
// owner's direction) for legibility at the sizes it renders at in the nav/
// footer/login chrome, where the emblem's own lettering is too small to
// read. `textClassName` lets each call site match its own background
// (navy text on light surfaces, white text on the navy footer/sidebar/
// mobile-nav panels).
export default function Logo({ className = '', size = 56, showText = true, textClassName = 'text-wwm-navy' }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logoUrl}
        alt="World Wide Missions International"
        width={size}
        height={size}
        className="shrink-0 object-contain"
      />
      {showText && (
        <span className={`leading-tight ${textClassName}`}>
          <span className="block text-[13px] font-bold tracking-[0.12em] uppercase">World Wide Missions</span>
          <span className="block text-[13px] font-bold tracking-[0.12em] uppercase">International</span>
        </span>
      )}
    </span>
  )
}

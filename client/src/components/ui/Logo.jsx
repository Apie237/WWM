import logoUrl from '../../assets/logo.55'

// Phase 6 §17: the real WWM logo asset (client/src/assets/logo.55, actually
// an animated WebP — see vite.config.js for how it's imported/built despite
// the non-standard extension) is a complete, self-contained circular emblem
// with "WORLD WIDE MISSIONS INTERNATIONAL" already lettered into the artwork
// itself. It is not a navy/white line icon needing a separate text wordmark
// or a light/dark color-mode swap (unlike the placeholder it replaces) — its
// own colors and white ring give it enough contrast on both the light header
// and the navy footer/mobile-nav backgrounds it's used against.
export default function Logo({ className = '', size = 40 }) {
  return (
    <img
      src={logoUrl}
      alt="World Wide Missions International"
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  )
}

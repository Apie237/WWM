// lucide-react no longer ships brand/logo icons (removed for trademark
// reasons in the version pinned in client/package.json), so the header and
// footer's social row uses these small hand-drawn, generic line-icon
// glyphs instead — flat, single-color, consistent with
// docs/DESIGN_SPEC.md §1.6's icon treatment.

export function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M14 8.5h-1.5A1.5 1.5 0 0 0 11 10v2M9.5 12H14M13 12v6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TwitterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
    </svg>
  )
}

export function YoutubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="3" />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

import { useEffect } from 'react'

// Minimal, single-purpose document-title setter — not a SEO/head-management
// system, just the "use meaningful dynamic titles" requirement for the
// Mission Locations pages (docs/PROJECT_SPEC.md Phase 5 instructions §33).
// Full SEO infrastructure remains Phase 10.
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    if (title) document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}

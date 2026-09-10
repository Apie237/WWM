import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Globe, X } from 'lucide-react'
import CTAButton from '../ui/CTAButton.jsx'
import Logo from '../ui/Logo.jsx'
import { NAV_ITEMS } from '../../lib/navigation.js'

// Off-canvas mobile navigation: expandable accordion groups (not hover),
// trapped focus while open, body-scroll lock, Escape to close, restores
// focus to the trigger on close (docs/DESIGN_SPEC.md §2.9, §16).
export default function MobileNavigation({ open, onClose, continents }) {
  const [expanded, setExpanded] = useState(null)
  const panelRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  function toggleGroup(label) {
    setExpanded((current) => (current === label ? null : label))
  }

  return (
    <div className="fixed inset-0 z-[60] sm:hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
      <div className="absolute inset-0 bg-wwm-neutral-900/60" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-wwm-navy">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Logo size={44} textClassName="text-wwm-white" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-11 w-11 items-center justify-center text-wwm-white"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 pt-4">
          <CTAButton to="/resources#give" variant="primary" onClick={onClose} className="w-full">
            Donate
          </CTAButton>
        </div>

        <ul className="flex-1 px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const hasChildren = Boolean(item.children) || item.mega
            const isExpanded = expanded === item.label

            if (!hasChildren) {
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className="block min-h-[44px] px-3 py-3 text-sm font-semibold uppercase tracking-wide text-wwm-white"
                  >
                    {item.label}
                  </Link>
                </li>
              )
            }

            return (
              <li key={item.label} className="border-b border-white/10 last:border-none">
                <button
                  type="button"
                  className="flex min-h-[44px] w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold uppercase tracking-wide text-wwm-white"
                  aria-expanded={isExpanded}
                  onClick={() => toggleGroup(item.label)}
                >
                  {item.label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {isExpanded && (
                  <ul className="pb-2 pl-3">
                    {item.mega
                      ? continents.map((continent) => (
                          <li key={continent.slug}>
                            <Link
                              to={`/mission-locations/${continent.slug}`}
                              onClick={onClose}
                              className="flex min-h-[44px] items-center gap-2 px-3 py-2 text-sm text-wwm-neutral-100"
                            >
                              <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
                              {continent.name}
                            </Link>
                          </li>
                        ))
                      : item.children.map((child) => (
                          <li key={child.label}>
                            <Link
                              to={child.to}
                              onClick={onClose}
                              className="block min-h-[44px] px-3 py-2 text-sm text-wwm-neutral-100"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                    {item.mega && continents.length === 0 && (
                      <li className="px-3 py-2 text-sm text-wwm-neutral-300">Continent directory unavailable.</li>
                    )}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ChevronDown, Globe, Menu, Search } from 'lucide-react'
import Logo from '../ui/Logo.jsx'
import Container from '../ui/Container.jsx'
import CTAButton from '../ui/CTAButton.jsx'
import MobileNavigation from './MobileNavigation.jsx'
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from '../ui/SocialIcons.jsx'
import { NAV_ITEMS } from '../../lib/navigation.js'
import { getContinents } from '../../services/api.js'

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
  { label: 'Twitter / X', href: 'https://twitter.com', icon: TwitterIcon },
  { label: 'YouTube', href: 'https://youtube.com', icon: YoutubeIcon },
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
]

function NavDropdown({ item, isOpen, onToggle, onClose }) {
  const itemRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        itemRef.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <div ref={itemRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-wwm-white transition-colors hover:text-wwm-gold-light focus-visible:outline-2 focus-visible:outline-wwm-gold focus-visible:outline-offset-[-2px]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => onToggle(item.label)}
      >
        {item.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-40 min-w-[260px] border border-wwm-neutral-300 bg-wwm-white py-2 shadow-sm">
          <ul>
            {item.children.map((child) => (
              <li key={child.label}>
                <Link
                  to={child.to}
                  onClick={onClose}
                  className="block px-4 py-2.5 text-sm text-wwm-navy hover:bg-wwm-bg hover:text-wwm-navy-light"
                >
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function MissionLocationsMenu({ isOpen, onToggle, onClose, continents }) {
  const itemRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        itemRef.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <div ref={itemRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-wwm-white transition-colors hover:text-wwm-gold-light focus-visible:outline-2 focus-visible:outline-wwm-gold focus-visible:outline-offset-[-2px]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => onToggle('Mission Locations')}
      >
        Mission Locations
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="absolute left-1/2 top-full z-40 w-[min(90vw,640px)] -translate-x-1/2 border border-wwm-neutral-300 bg-wwm-white p-6 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-wwm-gold">Select a Continent</p>
          {continents.length === 0 ? (
            <p className="text-sm text-wwm-neutral-600">Continent directory is loading or unavailable.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {continents.map((continent) => (
                <Link
                  key={continent.slug}
                  to={`/mission-locations/${continent.slug}`}
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 border border-wwm-neutral-300 px-3 py-4 text-center text-xs font-semibold uppercase tracking-wide text-wwm-navy hover:border-wwm-gold hover:text-wwm-navy-light"
                >
                  <Globe className="h-6 w-6 text-wwm-navy" aria-hidden="true" />
                  {continent.name}
                </Link>
              ))}
            </div>
          )}
          <div className="mt-5 border-t border-wwm-neutral-300 pt-4">
            <Link
              to="/mission-locations"
              onClick={onClose}
              className="text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold"
            >
              View All Mission Locations →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const [openMenu, setOpenMenu] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [continents, setContinents] = useState([])
  const headerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getContinents()
      .then(({ data }) => {
        if (!cancelled) setContinents(data)
      })
      .catch(() => {
        if (!cancelled) setContinents([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleMenu(label) {
    setOpenMenu((current) => (current === label ? null : label))
  }

  return (
    <header ref={headerRef} className="sticky top-0 z-50">
      {/* Utility bar */}
      <div className="border-b border-wwm-neutral-300 bg-wwm-white">
        <Container className="flex h-16 items-center justify-between">
          <Link to="/" aria-label="World Wide Missions — home">
            <Logo />
          </Link>
          <div className="hidden items-center gap-4 sm:flex">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="text-wwm-navy transition-colors hover:text-wwm-gold"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
            <span className="mx-1 h-4 w-px bg-wwm-neutral-300" aria-hidden="true" />
            <button
              type="button"
              aria-label="Search the site"
              className="text-wwm-navy transition-colors hover:text-wwm-gold"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center text-wwm-navy sm:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </Container>
      </div>

      {/* Main nav */}
      <nav aria-label="Primary" className="hidden bg-wwm-navy sm:block">
        <Container className="flex items-center justify-between">
          <ul className="flex items-center">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                {item.mega ? (
                  <MissionLocationsMenu
                    isOpen={openMenu === item.label}
                    onToggle={toggleMenu}
                    onClose={() => setOpenMenu(null)}
                    continents={continents}
                  />
                ) : item.children ? (
                  <NavDropdown
                    item={item}
                    isOpen={openMenu === item.label}
                    onToggle={toggleMenu}
                    onClose={() => setOpenMenu(null)}
                  />
                ) : (
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      `block px-4 py-4 text-sm font-semibold uppercase tracking-wide transition-colors hover:text-wwm-gold-light focus-visible:outline-2 focus-visible:outline-wwm-gold focus-visible:outline-offset-[-2px] ${
                        isActive ? 'text-wwm-gold-light' : 'text-wwm-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
          <CTAButton to="/resources#give" variant="primary" className="my-2">
            Donate
          </CTAButton>
        </Container>
      </nav>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} continents={continents} />
    </header>
  )
}

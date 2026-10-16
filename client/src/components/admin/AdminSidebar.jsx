import { Link, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Globe2,
  MapPin,
  Users,
  Building2,
  HeartHandshake,
  Landmark,
  UsersRound,
  Newspaper,
  CalendarDays,
  FileText,
  Megaphone,
  Mail,
  X,
} from 'lucide-react'
import Logo from '../ui/Logo.jsx'

// Phase 7 CMS modules. Every authenticated role can at least read all of
// these (server-side authorization narrows what each role can write —
// docs/CLAUDE.md Phase 7 §6/§9), so the nav itself does not hide entries by
// role; it is not the security boundary.
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Continents', to: '/admin/continents', icon: Globe2 },
  { label: 'Countries', to: '/admin/countries', icon: MapPin },
  { label: 'People', to: '/admin/people', icon: Users },
  { label: 'Churches & Institutions', to: '/admin/organizations', icon: Building2 },
  { label: 'Ministries', to: '/admin/ministries', icon: HeartHandshake },
  { label: 'Country Administration', to: '/admin/country-administrations', icon: Landmark },
  { label: 'Affiliate Pastors Board', to: '/admin/affiliate-pastors-boards', icon: UsersRound },
  { label: 'News', to: '/admin/news', icon: Newspaper },
  { label: 'Events', to: '/admin/events', icon: CalendarDays },
  { label: 'Resources', to: '/admin/resources', icon: FileText },
  { label: 'Prayer Requests', to: '/admin/prayer-requests', icon: Megaphone },
  { label: 'Contact Messages', to: '/admin/contact-messages', icon: Mail },
]

function NavList({ onNavigate }) {
  return (
    <ul className="flex-1 space-y-1 px-2 py-4">
      {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-wwm-gold focus-visible:outline-offset-[-2px] ${
                isActive ? 'bg-wwm-navy-light text-wwm-gold-light' : 'text-wwm-white hover:bg-wwm-navy-light'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

// Desktop: a permanently visible left column (docs/DESIGN_SPEC.md admin
// note, §14). Mobile: an off-canvas panel, mirroring the public site's
// MobileNavigation pattern (focus starts inside, Escape/backdrop-click to
// close) so admin and public nav behave consistently for keyboard/AT users.
export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col bg-wwm-navy sm:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
          <Link to="/admin/dashboard" aria-label="WWM admin — dashboard">
            <Logo size={40} showText={false} />
          </Link>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-wwm-gold-light">Admin</span>
        </div>
        <nav aria-label="Admin">
          <NavList />
        </nav>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 bg-wwm-neutral-900/60" onClick={onClose} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-wwm-navy">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-2.5">
                <Logo size={40} showText={false} />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-wwm-gold-light">Admin</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center text-wwm-white"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Admin">
              <NavList onNavigate={onClose} />
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

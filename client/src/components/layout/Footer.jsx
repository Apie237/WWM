import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import Container from '../ui/Container.jsx'
import Logo from '../ui/Logo.jsx'
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from '../ui/SocialIcons.jsx'
import { FOOTER_GROUPS } from '../../lib/navigation.js'

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
  { label: 'Twitter / X', href: 'https://twitter.com', icon: TwitterIcon },
  { label: 'YouTube', href: 'https://youtube.com', icon: YoutubeIcon },
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
]

// Institutional footer per docs/DESIGN_SPEC.md §12. Contact details are
// intentionally not hardcoded — no current headquarters address/phone/email
// has been supplied and verified (docs/PROJECT_SPEC.md §14 / Phase 4
// instructions: "Do not invent contact information"). This block is wired to
// show real data once a verified source exists.
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-wwm-navy text-wwm-neutral-100">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-1">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-wwm-neutral-100">
            Reaching nations. Transforming lives. Fulfilling the Great Commission.
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.heading}>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-wwm-gold-light">{group.heading}</h3>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-wwm-neutral-100 transition-colors hover:text-wwm-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-wwm-gold-light">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-wwm-neutral-100">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-wwm-gold" aria-hidden="true" />
              <span>Contact details will be published here once confirmed.</span>
            </li>
            <li className="flex items-center gap-2 opacity-60">
              <Phone className="h-4 w-4 shrink-0 text-wwm-gold" aria-hidden="true" />
              <span>Not yet published</span>
            </li>
            <li className="flex items-center gap-2 opacity-60">
              <Mail className="h-4 w-4 shrink-0 text-wwm-gold" aria-hidden="true" />
              <span>Not yet published</span>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-wwm-neutral-100">
            © {year} World Wide Missions International. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="text-wwm-neutral-100 transition-colors hover:text-wwm-gold"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  )
}

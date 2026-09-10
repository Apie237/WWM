import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-wwm-gold text-wwm-navy hover:bg-wwm-gold-light',
  secondary: 'border border-wwm-white text-wwm-white hover:bg-wwm-white hover:text-wwm-navy',
  'secondary-navy':
    'border border-wwm-navy text-wwm-navy hover:bg-wwm-navy hover:text-wwm-white',
  tertiary: 'bg-wwm-navy text-wwm-white hover:bg-wwm-navy-light',
}

const BASE =
  'inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-wwm-gold focus-visible:outline-offset-2'

// Primary (gold-filled), secondary (outline), and tertiary (small navy)
// button variants, per docs/DESIGN_SPEC.md §2.7 / §15.7. Renders as a
// react-router Link when `to` is given, otherwise a real <button>.
export default function CTAButton({ variant = 'primary', to, href, className = '', children, ...props }) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}

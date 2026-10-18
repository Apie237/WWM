import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

// React Router's client-side navigation does not perform the browser's
// native "scroll to #hash" behavior a full page load would — without this,
// every anchor link into a page section (Donate CTA, footer links, in-page
// nav) would land at the top of the target page instead of the section.
function useScrollToHashOrTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 })
      return
    }
    const target = document.getElementById(hash.slice(1))
    target?.scrollIntoView({ block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash])
}

export default function Layout() {
  useScrollToHashOrTop()

  return (
    <div className="flex min-h-screen flex-col bg-wwm-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-wwm-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-wwm-navy"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

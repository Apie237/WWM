import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar.jsx'
import AdminHeader from './AdminHeader.jsx'

// The admin shell (sidebar + header + content outlet) is intentionally its
// own layout, separate from the public site's <Layout/> (no public
// Header/Footer here) — docs/CLAUDE.md Phase 6 §12/§13.
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-wwm-bg">
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-wwm-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-wwm-navy"
      >
        Skip to main content
      </a>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main id="admin-main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

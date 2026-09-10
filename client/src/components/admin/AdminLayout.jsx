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
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main id="admin-main-content" className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

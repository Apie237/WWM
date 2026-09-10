import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  INTERNATIONAL_ADMIN: 'International Admin',
  COUNTRY_ADMIN: 'Country Admin',
  CONTENT_EDITOR: 'Content Editor',
}

export default function AdminHeader({ onMenuClick }) {
  const { admin, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/admin/login', { replace: true })
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-wwm-neutral-300 bg-wwm-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open admin menu"
        className="inline-flex h-11 w-11 items-center justify-center text-wwm-navy sm:hidden"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="hidden sm:block" />

      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-wwm-navy">{admin?.name}</p>
          <p className="text-xs uppercase tracking-wide text-wwm-neutral-600">
            {ROLE_LABELS[admin?.role] || admin?.role}
            {admin?.country ? ` — ${admin.country.name}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex min-h-[44px] items-center gap-2 border border-wwm-neutral-300 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy transition-colors hover:border-wwm-gold disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {loggingOut ? 'Signing out…' : 'Logout'}
        </button>
      </div>
    </header>
  )
}

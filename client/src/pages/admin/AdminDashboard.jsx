import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { fetchAdminDashboard } from '../../services/authApi.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import LoadingState from '../../components/ui/LoadingState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  INTERNATIONAL_ADMIN: 'International Admin',
  COUNTRY_ADMIN: 'Country Admin',
  CONTENT_EDITOR: 'Content Editor',
}

// Phase 6 foundation/shell only (docs/CLAUDE.md Phase 6 §12) — it calls the
// real, protected GET /api/admin/dashboard endpoint to prove the auth
// middleware chain works end to end, but renders no CMS content. Phase 7
// replaces this shell with real modules (Countries, Organizations, People,
// etc.).
export default function AdminDashboard() {
  useDocumentTitle('Dashboard | World Wide Missions Admin')
  const { admin } = useAuth()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchAdminDashboard()
      .then((data) => {
        if (cancelled) return
        setMessage(data.message)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold uppercase tracking-wide text-wwm-navy">
        Welcome, {admin?.name?.split(' ')[0] || 'Administrator'}
      </h1>
      <p className="mt-1 text-sm text-wwm-neutral-600">
        Signed in as {ROLE_LABELS[admin?.role] || admin?.role}
        {admin?.country ? ` for ${admin.country.name}` : ''}.
      </p>

      <div className="mt-6 border border-wwm-neutral-300 bg-wwm-white p-6">
        {status === 'loading' && <LoadingState label="Loading dashboard…" />}
        {status === 'error' && (
          <EmptyState
            title="Couldn't reach the admin API"
            description="Dashboard data is temporarily unavailable. Try refreshing the page."
          />
        )}
        {status === 'ready' && (
          <EmptyState
            title="Admin foundation established"
            description={message || 'Content management modules will be added in a future phase.'}
          />
        )}
      </div>
    </div>
  )
}

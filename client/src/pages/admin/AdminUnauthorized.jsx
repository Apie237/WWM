import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { useAuth } from '../../hooks/useAuth.js'

export default function AdminUnauthorized() {
  useDocumentTitle('Access Denied | World Wide Missions Admin')
  const { logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-wwm-bg px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-wwm-navy" aria-hidden="true" />
      <h1 className="text-lg font-bold uppercase tracking-wide text-wwm-navy">Access Denied</h1>
      <p className="max-w-sm text-sm text-wwm-neutral-600">
        Your administrator account does not have permission to view this page.
      </p>
      <div className="flex gap-3">
        <Link
          to="/admin/dashboard"
          className="bg-wwm-navy px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-wwm-white hover:bg-wwm-navy-light"
        >
          Back to Dashboard
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="border border-wwm-neutral-300 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:border-wwm-gold"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

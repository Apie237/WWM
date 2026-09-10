import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import LoadingState from '../ui/LoadingState.jsx'

// Backend API protection (requireAuth/requireRole in server/src/middleware/
// auth.js) remains the real security boundary — this only controls what the
// admin frontend shows/hides (docs/CLAUDE.md Phase 6 §16: "Do not rely
// exclusively on frontend route protection").
//
// `roles`, when given, restricts the wrapped routes to those admin roles;
// an authenticated admin outside that set is redirected to an access-denied
// page rather than silently bounced back to login.
export default function ProtectedRoute({ roles }) {
  const { admin, initializing, isAuthenticated } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wwm-bg">
        <LoadingState label="Checking your session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(admin.role)) {
    return <Navigate to="/admin/unauthorized" replace />
  }

  return <Outlet />
}

import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import Logo from '../../components/ui/Logo.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'

export default function AdminLogin() {
  useDocumentTitle('Administrator Sign In | World Wide Missions')
  const { isAuthenticated, initializing, login, sessionExpired } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Already signed in — don't show the login form again; send them where
  // they were headed (docs/CLAUDE.md Phase 6 §16: "Authenticated users
  // should not unnecessarily be redirected back to login").
  if (!initializing && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/admin/dashboard'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-wwm-navy px-4 py-12">
      <div className="w-full max-w-sm border border-wwm-neutral-300 bg-wwm-white p-8">
        <div className="mb-8 flex justify-center">
          <Logo size={80} showText={false} />
        </div>
        <h1 className="mb-1 text-center text-lg font-bold uppercase tracking-wide text-wwm-navy">
          Administrator Sign In
        </h1>
        <p className="mb-6 text-center text-sm text-wwm-neutral-600">World Wide Missions administration</p>

        {sessionExpired && !error && (
          <p role="status" className="mb-4 border border-wwm-gold bg-wwm-neutral-100 px-3 py-2 text-sm text-wwm-navy">
            Your session has ended. Please sign in again to continue.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-wwm-neutral-900">
              Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-wwm-neutral-300 px-3 py-2.5 text-sm text-wwm-neutral-900 focus-visible:outline-2 focus-visible:outline-wwm-gold"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-wwm-neutral-900">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-wwm-neutral-300 px-3 py-2.5 text-sm text-wwm-neutral-900 focus-visible:outline-2 focus-visible:outline-wwm-gold"
            />
          </div>

          {error && (
            <p role="alert" className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-wwm-gold px-4 py-3 text-sm font-semibold uppercase tracking-wider text-wwm-navy transition-colors hover:bg-wwm-gold-light focus-visible:outline-2 focus-visible:outline-wwm-navy focus-visible:outline-offset-2 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

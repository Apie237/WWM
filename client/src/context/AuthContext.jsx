import { useCallback, useEffect, useState } from 'react'
import { fetchCurrentAdmin, loginRequest, logoutRequest } from '../services/authApi.js'
import { AuthContext } from './authContext.js'

// One shared place for "is an admin signed in, and who are they" — Phase 6
// §15: avoids re-implementing this fetch/state dance on every admin page.
// `admin` is null until proven otherwise; `initializing` distinguishes "we
// haven't checked yet" from "we checked and nobody's signed in", so
// ProtectedRoute doesn't redirect to /admin/login before the initial
// GET /api/auth/me call has even resolved.
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchCurrentAdmin()
      .then((data) => {
        if (!cancelled) setAdmin(data)
      })
      .catch(() => {
        if (!cancelled) setAdmin(null)
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password)
    setAdmin(data)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setAdmin(null)
    }
  }, [])

  const value = {
    admin,
    initializing,
    isAuthenticated: Boolean(admin),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchCurrentAdmin, loginRequest, logoutRequest, setUnauthorizedHandler } from '../services/authApi.js'
import { AuthContext } from './authContext.js'

// One shared place for "is an admin signed in, and who are they" — Phase 6
// §15: avoids re-implementing this fetch/state dance on every admin page.
// `admin` is null until proven otherwise; `initializing` distinguishes "we
// haven't checked yet" from "we checked and nobody's signed in", so
// ProtectedRoute doesn't redirect to /admin/login before the initial
// GET /api/auth/me call has even resolved.
export function AuthProvider({ children }) {
  const { pathname } = useLocation()
  const onAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const [admin, setAdmin] = useState(null)
  const [checked, setChecked] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const adminRef = useRef(null)
  useEffect(() => {
    adminRef.current = admin
  }, [admin])

  // A 401 on any admin request after sign-in means the session ended.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (adminRef.current) setSessionExpired(true)
      setAdmin(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // Phase 10: the session check only runs once the visitor is actually in the
  // admin area, so ordinary public visitors never make an /auth/me request.
  useEffect(() => {
    if (!onAdminPath || checked) return
    let cancelled = false
    fetchCurrentAdmin()
      .then((data) => {
        if (!cancelled) setAdmin(data)
      })
      .catch(() => {
        if (!cancelled) setAdmin(null)
      })
      .finally(() => {
        if (!cancelled) setChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [onAdminPath, checked])

  const initializing = onAdminPath && !checked

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password)
    setSessionExpired(false)
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
    sessionExpired,
    isAuthenticated: Boolean(admin),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

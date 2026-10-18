import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Separate axios instance from services/api.js's public `api` client:
// `withCredentials: true` makes the browser send/accept the httpOnly admin
// session cookie, which the public site's read-only calls never need.
export const authApi = axios.create({ baseURL, withCredentials: true, timeout: 15000 })

// When an admin's session expires (or is revoked) mid-work, any admin request
// comes back 401. The login and "who am I" calls are excluded: a 401 there is
// an ordinary "not signed in" answer, not an expiry. The AuthProvider
// registers the handler so the UI returns to the sign-in page with an
// explanation instead of showing a confusing "could not save" error.
let unauthorizedHandler = null
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || ''
    const isAuthProbe = url.endsWith('/auth/login') || url.endsWith('/auth/me') || url.endsWith('/auth/logout')
    if (error?.response?.status === 401 && !isAuthProbe) unauthorizedHandler?.()
    return Promise.reject(error)
  },
)

export async function loginRequest(email, password) {
  const { data } = await authApi.post('/auth/login', { email, password })
  return data.data.admin
}

export async function logoutRequest() {
  await authApi.post('/auth/logout')
}

export async function fetchCurrentAdmin() {
  const { data } = await authApi.get('/auth/me')
  return data.data.admin
}

export async function fetchAdminDashboard() {
  const { data } = await authApi.get('/admin/dashboard')
  return data.data
}

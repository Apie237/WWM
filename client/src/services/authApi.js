import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Separate axios instance from services/api.js's public `api` client:
// `withCredentials: true` makes the browser send/accept the httpOnly admin
// session cookie, which the public site's read-only calls never need.
export const authApi = axios.create({ baseURL, withCredentials: true })

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

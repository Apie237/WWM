import { authApi } from './authApi.js'

// Phase 7 CMS admin API client. Separate from services/api.js (the public,
// read-only site API) and services/authApi.js (auth/session calls) — this
// file is every authenticated /api/admin/* CRUD call the new CMS screens
// use, built on the same `authApi` axios instance (withCredentials: true)
// so the httpOnly admin session cookie is sent automatically.
//
// Every admin endpoint responds with { success, data, pagination? }, same
// envelope as the public API — `unwrap` below mirrors services/api.js's own
// helper so callers get back the bare payload and let a rejected promise
// carry any error (401/403/404/409/400) for the calling page's own
// loading/error state to handle.
async function unwrap(request) {
  const { data: body } = await request
  return { data: body.data, pagination: body.pagination ?? null }
}

function crud(resource) {
  return {
    list: (params = {}) => unwrap(authApi.get(`/admin/${resource}`, { params })),
    get: (id) => unwrap(authApi.get(`/admin/${resource}/${id}`)),
    create: (payload) => unwrap(authApi.post(`/admin/${resource}`, payload)),
    update: (id, payload) => unwrap(authApi.patch(`/admin/${resource}/${id}`, payload)),
    remove: (id) => unwrap(authApi.delete(`/admin/${resource}/${id}`)),
  }
}

export const continentsApi = crud('continents')
export const countriesApi = crud('countries')
export const peopleApi = crud('people')
export const organizationsApi = crud('organizations')
export const ministriesApi = crud('ministries')
// Phase 8 content modules.
export const newsApi = crud('news')
export const eventsApi = crud('events')
export const resourcesApi = crud('resources')
export const prayerRequestsApi = crud('prayer-requests')
export const contactMessagesApi = crud('contact-messages')
export const countryAdministrationsApi = {
  ...crud('country-administrations'),
  addPosition: (id, payload) => unwrap(authApi.post(`/admin/country-administrations/${id}/positions`, payload)),
  updatePosition: (id, entryId, payload) =>
    unwrap(authApi.patch(`/admin/country-administrations/${id}/positions/${entryId}`, payload)),
  removePosition: (id, entryId) => unwrap(authApi.delete(`/admin/country-administrations/${id}/positions/${entryId}`)),
}
export const affiliatePastorsBoardsApi = {
  ...crud('affiliate-pastors-boards'),
  addMember: (id, payload) => unwrap(authApi.post(`/admin/affiliate-pastors-boards/${id}/members`, payload)),
  updateMember: (id, entryId, payload) =>
    unwrap(authApi.patch(`/admin/affiliate-pastors-boards/${id}/members/${entryId}`, payload)),
  removeMember: (id, entryId) => unwrap(authApi.delete(`/admin/affiliate-pastors-boards/${id}/members/${entryId}`)),
}

// True when `error` is an axios rejection carrying the given HTTP status —
// mirrors services/api.js's isHttpStatus so CMS pages can tell "not found"
// or "conflict" apart from other failures without reaching into
// error.response.status directly.
export function isHttpStatus(error, status) {
  return error?.response?.status === status
}

// A server error's message, when the backend sent one in the standard
// { error: "..." } envelope (server/src/middleware/errorHandler.js) — falls
// back to a generic message so a network failure or unexpected shape never
// renders "undefined".
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.error || fallback
}

// Phase 9 media. The browser never sees Cloudinary credentials: the file goes
// to our API as the raw request body, the server validates and signs the
// upload, and we get back { publicId, url } to store on the record.
export const mediaApi = {
  config: () => unwrap(authApi.get('/admin/media/config')),
  upload: (kind, file, onProgress) =>
    unwrap(
      authApi.post(`/admin/media/upload/${kind}`, file, {
        headers: { 'Content-Type': file.type },
        timeout: 60000,
        onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : null),
      }),
    ),
}

// History entries (HistoryEvent).
export const historyApi = crud('history')

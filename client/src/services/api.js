import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({ baseURL })

// Every public endpoint responds with { success, data, pagination? }.
// Callers get back the unwrapped payload; a network/API failure propagates
// as a rejected promise for the caller's own loading/error state to handle.
async function unwrap(request) {
  const { data: body } = await request
  return { data: body.data, pagination: body.pagination ?? null }
}

export function getContinents() {
  return unwrap(api.get('/continents'))
}

export function getContinent(slug) {
  return unwrap(api.get(`/continents/${slug}`))
}

export function getCountriesByContinent(continentSlug, params = {}) {
  return unwrap(api.get(`/continents/${continentSlug}/countries`, { params }))
}

export function getCountries(params = {}) {
  return unwrap(api.get('/countries', { params }))
}

export function getCountry(slug) {
  return unwrap(api.get(`/countries/${slug}`))
}

export function getCountryAdministration(slug) {
  return unwrap(api.get(`/countries/${slug}/administration`))
}

export function getAffiliatePastorsBoard(slug) {
  return unwrap(api.get(`/countries/${slug}/affiliate-pastors`))
}

// True when `error` is an axios rejection carrying the given HTTP status —
// lets callers distinguish "not found" from other failures without every
// page reaching into `error.response.status` directly.
export function isHttpStatus(error, status) {
  return error?.response?.status === status
}

export function getOrganizations(params = {}) {
  return unwrap(api.get('/organizations', { params }))
}

export function getPeople(params = {}) {
  return unwrap(api.get('/people', { params }))
}

export function getMinistries(params = {}) {
  return unwrap(api.get('/ministries', { params }))
}

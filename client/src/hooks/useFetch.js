import { useEffect, useState } from 'react'

// Minimal fetch-on-mount state for the public list sections:
// { status: 'loading' | 'ready' | 'error', data, pagination }.
// `fetcher` must be a stable function reference (a services/api.js export);
// `params` is compared by value so an inline object does not refetch every render.
export function useFetch(fetcher, params) {
  const key = JSON.stringify(params ?? {})
  const [state, setState] = useState({ status: 'loading', data: [], pagination: null })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, status: 'loading' }))
    fetcher(JSON.parse(key))
      .then(({ data, pagination }) => !cancelled && setState({ status: 'ready', data, pagination }))
      .catch(() => !cancelled && setState({ status: 'error', data: [], pagination: null }))
    return () => {
      cancelled = true
    }
  }, [fetcher, key])

  return state
}

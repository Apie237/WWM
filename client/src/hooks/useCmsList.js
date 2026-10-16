import { useEffect, useRef, useState } from 'react'

// Shared data-fetching state machine for every CMS list page: search +
// filters + pagination + loading/empty/error states, re-fetched whenever
// any of them change. One hook instead of re-implementing the same
// effect/state wiring in all 8 modules' list pages.
//
// `fetchList(params)` is one of the adminApi `*.list` functions. `filters`
// is a plain object of extra query params (e.g. `{ country, type }`) the
// caller manages itself and passes in; changing it (by identity/shallow
// value via JSON) re-triggers a fetch from page 1.
export function useCmsList(fetchList, filters = {}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('loading')
  const requestId = useRef(0)

  // Debounce the search box so every keystroke doesn't fire a request.
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  // Any filter/search change resets to page 1 — staying on, say, page 4 of
  // a now-different result set would just show an empty page.
  const filterKey = JSON.stringify(filters)
  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterKey])

  useEffect(() => {
    const id = ++requestId.current
    setStatus('loading')
    fetchList({ page, search: debouncedSearch || undefined, ...filters })
      .then(({ data, pagination: meta }) => {
        if (id !== requestId.current) return
        setItems(data)
        setPagination(meta)
        setStatus('ready')
      })
      .catch(() => {
        if (id !== requestId.current) return
        setStatus('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, filterKey])

  const refresh = () => {
    // Re-runs the same effect by bumping nothing visible — simplest is to
    // just re-fire the fetch with current params directly.
    const id = ++requestId.current
    setStatus('loading')
    fetchList({ page, search: debouncedSearch || undefined, ...filters })
      .then(({ data, pagination: meta }) => {
        if (id !== requestId.current) return
        setItems(data)
        setPagination(meta)
        setStatus('ready')
      })
      .catch(() => {
        if (id !== requestId.current) return
        setStatus('error')
      })
  }

  return { items, pagination, status, page, setPage, search, setSearch, refresh }
}

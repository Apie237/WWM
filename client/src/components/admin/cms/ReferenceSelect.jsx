import { useEffect, useState } from 'react'
import { inputClasses } from './FormField.jsx'

// A <select> populated from an admin list endpoint, so forms never ask an
// administrator to type a raw ObjectId for a reference field (continent,
// country, person, organization — docs/CLAUDE.md "reference selectors
// (not raw ObjectId entry)"). `fetchOptions` is one of the adminApi `list`
// functions; `getLabel`/`getValue` read the display text and id off each
// returned record. Loads once per mount — reference lists (continents,
// countries) are small enough that a fixed, generous `limit` covers the
// whole directory without pagination.
export default function ReferenceSelect({
  id,
  value,
  onChange,
  fetchOptions,
  getLabel = (item) => item.name,
  getValue = (item) => item._id,
  placeholder = 'Select…',
  allowEmpty = true,
  disabled,
  params,
}) {
  const [options, setOptions] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    fetchOptions({ limit: 500, ...(params || {}) })
      .then(({ data }) => {
        if (!cancelled) {
          setOptions(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])

  return (
    <select
      id={id}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled || status === 'loading'}
      className={inputClasses}
    >
      {allowEmpty && <option value="">{status === 'loading' ? 'Loading…' : placeholder}</option>}
      {status === 'error' && <option value="">Couldn&apos;t load options</option>}
      {options.map((item) => (
        <option key={getValue(item)} value={getValue(item)}>
          {getLabel(item)}
        </option>
      ))}
    </select>
  )
}

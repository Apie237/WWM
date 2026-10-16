import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { eventsApi, countriesApi } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import { formatDateRange } from '../../../lib/format.js'

const DELETE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN']

export default function EventsList() {
  useDocumentTitle('Events | World Wide Missions Admin')
  const { admin } = useAuth()
  const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const list = useCmsList(eventsApi.list, { status: status || undefined, country: !isCountryAdmin ? country || undefined : undefined })

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'startDate', label: 'Date', render: (r) => formatDateRange(r.startDate, r.endDate) },
    { key: 'country', label: 'Country', render: (r) => r.country?.name || 'International' },
    { key: 'status', label: 'Status', render: (r) => (r.status === 'published' ? 'Published' : 'Draft') },
  ]

  return (
    <ListPageShell
      title="Events"
      createTo="/admin/events/new"
      search={list.search}
      onSearchChange={list.setSearch}
      searchPlaceholder="Search events…"
      filters={
        <>
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          {!isCountryAdmin && <ReferenceSelect value={country} onChange={(v) => setCountry(v || '')} fetchOptions={countriesApi.list} placeholder="All countries" />}
        </>
      }
      columns={columns}
      rows={list.items}
      status={list.status}
      pagination={list.pagination}
      onPageChange={list.setPage}
      emptyTitle="No events yet"
      actions={(row) => (
        <RowActions
          editTo={`/admin/events/${row._id}`}
          canDelete={DELETE_ROLES.includes(admin?.role)}
          itemLabel={`the event "${row.title}"`}
          onDelete={() => eventsApi.remove(row._id)}
          onDeleted={list.refresh}
        />
      )}
    />
  )
}

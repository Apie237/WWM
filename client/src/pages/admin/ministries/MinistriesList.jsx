import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { ministriesApi, countriesApi } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import { MINISTRY_TYPES } from './ministryTypes.js'

const DELETE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN']

export default function MinistriesList() {
  useDocumentTitle('Ministries | World Wide Missions Admin')
  const { admin } = useAuth()
  const canDelete = DELETE_ROLES.includes(admin?.role)
  const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
  const [ministryType, setMinistryType] = useState('')
  const [country, setCountry] = useState('')
  const { items, pagination, status, setPage, search, setSearch, refresh } = useCmsList(ministriesApi.list, {
    ministryType: ministryType || undefined,
    country: !isCountryAdmin ? country || undefined : undefined,
  })

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'ministryType', label: 'Type', render: (row) => row.ministryType.replace(/_/g, ' ') },
    { key: 'country', label: 'Country', render: (row) => row.country?.name || 'International' },
    { key: 'isActive', label: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
  ]

  return (
    <ListPageShell
      title="Ministries"
      createTo="/admin/ministries/new"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search ministries…"
      filters={
        <>
          <select value={ministryType} onChange={(e) => setMinistryType(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="">All types</option>
            {MINISTRY_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          {!isCountryAdmin && (
            <ReferenceSelect value={country} onChange={(v) => setCountry(v || '')} fetchOptions={countriesApi.list} placeholder="All countries" />
          )}
        </>
      }
      columns={columns}
      rows={items}
      status={status}
      pagination={pagination}
      onPageChange={setPage}
      emptyTitle="No ministries yet"
      actions={(row) => (
        <RowActions
          editTo={`/admin/ministries/${row._id}`}
          canDelete={canDelete}
          itemLabel={`the ministry "${row.name}"`}
          onDelete={() => ministriesApi.remove(row._id)}
          onDeleted={refresh}
        />
      )}
    />
  )
}

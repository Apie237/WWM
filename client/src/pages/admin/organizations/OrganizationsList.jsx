import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { organizationsApi, countriesApi } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import { ORGANIZATION_TYPES } from './organizationTypes.js'

const DELETE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN']

export default function OrganizationsList() {
  useDocumentTitle('Churches & Institutions | World Wide Missions Admin')
  const { admin } = useAuth()
  const canDelete = DELETE_ROLES.includes(admin?.role)
  const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
  const [type, setType] = useState('')
  const [country, setCountry] = useState('')
  const { items, pagination, status, setPage, search, setSearch, refresh } = useCmsList(organizationsApi.list, {
    type: type || undefined,
    country: !isCountryAdmin ? country || undefined : undefined,
  })

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (row) => row.type.replace(/_/g, ' ') },
    { key: 'country', label: 'Country', render: (row) => row.country?.name || '—' },
    { key: 'isActive', label: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
  ]

  return (
    <ListPageShell
      title="Churches & Institutions"
      createTo="/admin/organizations/new"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search organizations…"
      filters={
        <>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="">All types</option>
            {ORGANIZATION_TYPES.map((t) => (
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
      emptyTitle="No organizations yet"
      actions={(row) => (
        <RowActions
          editTo={`/admin/organizations/${row._id}`}
          canDelete={canDelete}
          itemLabel={`the organization "${row.name}"`}
          onDelete={() => organizationsApi.remove(row._id)}
          onDeleted={refresh}
        />
      )}
    />
  )
}

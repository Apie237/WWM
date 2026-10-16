import { useAuth } from '../../../hooks/useAuth.js'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { countriesApi, continentsApi } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import { useState } from 'react'

const STRUCTURAL_WRITE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN']

export default function CountriesList() {
  useDocumentTitle('Countries | World Wide Missions Admin')
  const { admin } = useAuth()
  const canCreateDelete = STRUCTURAL_WRITE_ROLES.includes(admin?.role)
  const [continent, setContinent] = useState('')
  const { items, pagination, status, setPage, search, setSearch, refresh } = useCmsList(countriesApi.list, {
    continent: continent || undefined,
  })

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'continent', label: 'Continent', render: (row) => row.continent?.name || '—' },
    { key: 'isoCode', label: 'ISO Code', render: (row) => row.isoCode || '—' },
    { key: 'isActive', label: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
  ]

  return (
    <ListPageShell
      title="Countries"
      createTo="/admin/countries/new"
      canCreate={canCreateDelete}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search countries…"
      filters={
        canCreateDelete && (
          <ReferenceSelect
            value={continent}
            onChange={(v) => setContinent(v || '')}
            fetchOptions={continentsApi.list}
            placeholder="All continents"
          />
        )
      }
      columns={columns}
      rows={items}
      status={status}
      pagination={pagination}
      onPageChange={setPage}
      emptyTitle="No countries yet"
      actions={(row) => (
        <RowActions
          editTo={`/admin/countries/${row._id}`}
          canDelete={canCreateDelete}
          itemLabel={`the country "${row.name}"`}
          onDelete={() => countriesApi.remove(row._id)}
          onDeleted={refresh}
        />
      )}
    />
  )
}

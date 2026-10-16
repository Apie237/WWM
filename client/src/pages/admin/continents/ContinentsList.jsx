import { useAuth } from '../../../hooks/useAuth.js'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { continentsApi } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'

const WRITE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN']

export default function ContinentsList() {
  useDocumentTitle('Continents | World Wide Missions Admin')
  const { admin } = useAuth()
  const canWrite = WRITE_ROLES.includes(admin?.role)
  const { items, pagination, status, setPage, search, setSearch, refresh } = useCmsList(continentsApi.list)

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code', render: (row) => row.code || '—' },
    { key: 'order', label: 'Order' },
    { key: 'isActive', label: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
  ]

  return (
    <ListPageShell
      title="Continents"
      createTo="/admin/continents/new"
      canCreate={canWrite}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search continents…"
      columns={columns}
      rows={items}
      status={status}
      pagination={pagination}
      onPageChange={setPage}
      emptyTitle="No continents yet"
      emptyDescription={canWrite ? 'Add the first continent to begin building the directory.' : undefined}
      actions={
        canWrite &&
        ((row) => (
          <RowActions
            editTo={`/admin/continents/${row._id}`}
            itemLabel={`the continent "${row.name}"`}
            onDelete={() => continentsApi.remove(row._id)}
            onDeleted={refresh}
          />
        ))
      }
    />
  )
}

import { useAuth } from '../../../hooks/useAuth.js'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { peopleApi } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'

const DELETE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN']

export default function PeopleList() {
  useDocumentTitle('People | World Wide Missions Admin')
  const { admin } = useAuth()
  const canDelete = DELETE_ROLES.includes(admin?.role)
  const { items, pagination, status, setPage, search, setSearch, refresh } = useCmsList(peopleApi.list)

  const columns = [
    { key: 'displayName', label: 'Name' },
    {
      key: 'roles',
      label: 'Roles',
      render: (row) =>
        row.roles?.length
          ? row.roles.map((r) => `${r.title} (${r.country?.name || 'International'})`).join(', ')
          : '—',
    },
    { key: 'isActive', label: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
  ]

  return (
    <ListPageShell
      title="People"
      createTo="/admin/people/new"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search people…"
      columns={columns}
      rows={items}
      status={status}
      pagination={pagination}
      onPageChange={setPage}
      emptyTitle="No people yet"
      actions={(row) => (
        <RowActions
          editTo={`/admin/people/${row._id}`}
          canDelete={canDelete}
          itemLabel={`the record for "${row.displayName}"`}
          onDelete={() => peopleApi.remove(row._id)}
          onDeleted={refresh}
        />
      )}
    />
  )
}

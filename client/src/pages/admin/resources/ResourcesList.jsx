import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { resourcesApi } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'
import { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import { RESOURCE_TYPE_LABELS } from '../../../lib/format.js'

const WRITE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'CONTENT_EDITOR']
const DELETE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN']

export default function ResourcesList() {
  useDocumentTitle('Resources | World Wide Missions Admin')
  const { admin } = useAuth()
  const [status, setStatus] = useState('')
  const [resourceType, setResourceType] = useState('')
  const list = useCmsList(resourcesApi.list, { status: status || undefined, resourceType: resourceType || undefined })
  const canWrite = WRITE_ROLES.includes(admin?.role)

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'resourceType', label: 'Type', render: (r) => RESOURCE_TYPE_LABELS[r.resourceType] || r.resourceType },
    { key: 'status', label: 'Status', render: (r) => (r.status === 'published' ? 'Published' : 'Draft') },
    { key: 'order', label: 'Order' },
  ]

  return (
    <ListPageShell
      title="Resources"
      createTo="/admin/resources/new"
      canCreate={canWrite}
      search={list.search}
      onSearchChange={list.setSearch}
      searchPlaceholder="Search resources…"
      filters={
        <>
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select aria-label="Filter by type" value={resourceType} onChange={(e) => setResourceType(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="">All types</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </>
      }
      columns={columns}
      rows={list.items}
      status={list.status}
      pagination={list.pagination}
      onPageChange={list.setPage}
      emptyTitle="No resources yet"
      actions={(row) => (
        <RowActions
          editTo={`/admin/resources/${row._id}`}
          canEdit={canWrite}
          canDelete={DELETE_ROLES.includes(admin?.role)}
          itemLabel={`the resource "${row.title}"`}
          onDelete={() => resourcesApi.remove(row._id)}
          onDeleted={list.refresh}
        />
      )}
    />
  )
}

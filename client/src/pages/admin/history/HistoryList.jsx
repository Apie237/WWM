import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { historyApi } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'
import { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import { HISTORY_SECTION_LABELS, HISTORY_REVIEW_LABELS } from '../../../lib/history.js'

const WRITE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'CONTENT_EDITOR']
const DELETE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN']

export default function HistoryList() {
  useDocumentTitle('History | World Wide Missions Admin')
  const { admin } = useAuth()
  const [status, setStatus] = useState('')
  const [section, setSection] = useState('')
  const [reviewStatus, setReviewStatus] = useState('')
  const list = useCmsList(historyApi.list, {
    status: status || undefined,
    section: section || undefined,
    reviewStatus: reviewStatus || undefined,
  })
  const canWrite = WRITE_ROLES.includes(admin?.role)

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'section', label: 'Section', render: (r) => HISTORY_SECTION_LABELS[r.section] || r.section },
    { key: 'dateLabel', label: 'Date', render: (r) => r.dateLabel || '—' },
    { key: 'status', label: 'Status', render: (r) => (r.status === 'published' ? 'Published' : 'Draft') },
    { key: 'reviewStatus', label: 'Review (private)', render: (r) => HISTORY_REVIEW_LABELS[r.reviewStatus] || r.reviewStatus },
    { key: 'order', label: 'Order' },
  ]

  return (
    <ListPageShell
      title="History"
      createTo="/admin/history/new"
      canCreate={canWrite}
      search={list.search}
      onSearchChange={list.setSearch}
      searchPlaceholder="Search history entries…"
      filters={
        <>
          <select aria-label="Filter by section" value={section} onChange={(e) => setSection(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="">All sections</option>
            {Object.entries(HISTORY_SECTION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select aria-label="Filter by review status" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="">All review states</option>
            {Object.entries(HISTORY_REVIEW_LABELS).map(([v, l]) => (
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
      emptyTitle="No history entries yet"
      actions={(row) => (
        <RowActions
          editTo={`/admin/history/${row._id}`}
          canEdit={canWrite}
          canDelete={DELETE_ROLES.includes(admin?.role)}
          itemLabel={`the history entry "${row.title}"`}
          onDelete={() => historyApi.remove(row._id)}
          onDeleted={list.refresh}
        />
      )}
    />
  )
}

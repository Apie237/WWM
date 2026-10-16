import { useState } from 'react'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { prayerRequestsApi, errorMessage } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'
import Alert from '../../../components/admin/cms/Alert.jsx'
import { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import { formatDate } from '../../../lib/format.js'

// Moderation inbox. Nothing here is public until set to "approved".
export default function PrayerRequestsAdmin() {
  useDocumentTitle('Prayer Requests | World Wide Missions Admin')
  const [status, setStatus] = useState('pending')
  const [error, setError] = useState(null)
  const list = useCmsList(prayerRequestsApi.list, { status: status || undefined })

  async function setRequestStatus(row, next) {
    setError(null)
    try {
      await prayerRequestsApi.update(row._id, { status: next })
      list.refresh()
    } catch (err) {
      setError(errorMessage(err, 'Could not update this request.'))
    }
  }

  const columns = [
    { key: 'request', label: 'Request', render: (r) => <span className="whitespace-pre-line">{r.request}</span> },
    { key: 'name', label: 'Submitted by', render: (r) => (r.name ? `${r.name}${r.showName ? ' (shown publicly)' : ' (kept private)'}` : 'Anonymous') },
    { key: 'country', label: 'Country', render: (r) => r.country?.name || '—' },
    { key: 'createdAt', label: 'Received', render: (r) => formatDate(r.createdAt) },
    { key: 'status', label: 'Status', render: (r) => r.status },
  ]

  return (
    <>
      <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>
      <ListPageShell
        title="Prayer Requests"
        canCreate={false}
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search requests…"
        filters={
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="pending">Pending review</option>
            <option value="approved">Approved (public)</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        }
        columns={columns}
        rows={list.items}
        status={list.status}
        pagination={list.pagination}
        onPageChange={list.setPage}
        emptyTitle="No prayer requests here"
        actions={(row) => (
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-3 text-sm font-semibold uppercase tracking-wide">
              {row.status !== 'approved' && (
                <button type="button" onClick={() => setRequestStatus(row, 'approved')} className="text-wwm-navy hover:text-wwm-gold">Approve</button>
              )}
              {row.status !== 'rejected' && (
                <button type="button" onClick={() => setRequestStatus(row, 'rejected')} className="text-wwm-neutral-600 hover:text-wwm-navy">Reject</button>
              )}
            </div>
            <RowActions canEdit={false} itemLabel="this prayer request" onDelete={() => prayerRequestsApi.remove(row._id)} onDeleted={list.refresh} />
          </div>
        )}
      />
    </>
  )
}

import { useState } from 'react'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { contactMessagesApi, errorMessage } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'
import Alert from '../../../components/admin/cms/Alert.jsx'
import { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import { formatDate } from '../../../lib/format.js'

// Read-only inbox for the public Contact form (international admins only).
export default function ContactMessagesAdmin() {
  useDocumentTitle('Contact Messages | World Wide Missions Admin')
  const [status, setStatus] = useState('new')
  const [error, setError] = useState(null)
  const list = useCmsList(contactMessagesApi.list, { status: status || undefined })

  async function setMessageStatus(row, next) {
    setError(null)
    try {
      await contactMessagesApi.update(row._id, { status: next })
      list.refresh()
    } catch (err) {
      setError(errorMessage(err, 'Could not update this message.'))
    }
  }

  const columns = [
    { key: 'from', label: 'From', render: (r) => (<><span className="font-semibold">{r.name}</span><br /><a className="text-wwm-navy underline" href={`mailto:${r.email}`}>{r.email}</a></>) },
    { key: 'subject', label: 'Subject', render: (r) => r.subject || '—' },
    { key: 'message', label: 'Message', render: (r) => <span className="whitespace-pre-line">{r.message}</span> },
    { key: 'createdAt', label: 'Received', render: (r) => formatDate(r.createdAt) },
    { key: 'status', label: 'Status' },
  ]

  return (
    <>
      <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>
      <ListPageShell
        title="Contact Messages"
        canCreate={false}
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search messages…"
        filters={
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClasses + ' w-auto'}>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
            <option value="">All</option>
          </select>
        }
        columns={columns}
        rows={list.items}
        status={list.status}
        pagination={list.pagination}
        onPageChange={list.setPage}
        emptyTitle="No messages here"
        actions={(row) => (
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-3 text-sm font-semibold uppercase tracking-wide">
              {row.status === 'new' && <button type="button" onClick={() => setMessageStatus(row, 'read')} className="text-wwm-navy hover:text-wwm-gold">Mark read</button>}
              {row.status !== 'archived' && <button type="button" onClick={() => setMessageStatus(row, 'archived')} className="text-wwm-neutral-600 hover:text-wwm-navy">Archive</button>}
            </div>
            <RowActions canEdit={false} itemLabel="this message" onDelete={() => contactMessagesApi.remove(row._id)} onDeleted={list.refresh} />
          </div>
        )}
      />
    </>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useCmsList } from '../../../hooks/useCmsList.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { countriesApi, errorMessage } from '../../../services/adminApi.js'
import ListPageShell from '../../../components/admin/cms/ListPageShell.jsx'
import RowActions from '../../../components/admin/cms/RowActions.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import HierarchyEntryList from '../../../components/admin/cms/HierarchyEntryList.jsx'
import HierarchyEntryModal from '../../../components/admin/cms/HierarchyEntryModal.jsx'
import Alert from '../../../components/admin/cms/Alert.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'

const WRITE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN']

// CountryAdministration and AffiliatePastorsBoard are two separate backend
// models with identical shapes (one "current vs. historical" document per
// country, holding a self-referencing hierarchy array — `positions` or
// `members`). This factory builds the matching List/Form(meta)/Detail(entry
// management) page trio once, parameterized by which module it is, instead
// of duplicating the same ~300 lines of CRUD/tree-editing UI twice
// (docs/CLAUDE.md "reuse components and services instead of duplicating
// logic").
export function createLeadershipStructureModule({ api, entriesKey, entryNoun, title, basePath, addEntry, updateEntry, removeEntry }) {
  function List() {
    useDocumentTitle(`${title} | World Wide Missions Admin`)
    const { admin } = useAuth()
    const canWrite = WRITE_ROLES.includes(admin?.role)
    const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
    const [country, setCountry] = useState('')
    const { items, pagination, status, setPage, refresh } = useCmsList(api.list, {
      country: !isCountryAdmin ? country || undefined : undefined,
    })

    const columns = [
      { key: 'country', label: 'Country', render: (row) => row.country?.name || '—' },
      { key: 'current', label: 'Status', render: (row) => (row.current ? 'Current' : 'Historical') },
      { key: 'effectiveFrom', label: 'Effective from', render: (row) => row.effectiveFrom?.year || '—' },
      { key: 'effectiveTo', label: 'Effective to', render: (row) => row.effectiveTo?.year || '—' },
      { key: 'entries', label: entryNoun === 'position' ? 'Positions' : 'Members', render: (row) => row[entriesKey]?.length ?? 0 },
    ]

    return (
      <ListPageShell
        title={title}
        createTo={`${basePath}/new`}
        canCreate={canWrite}
        hideSearch
        filters={
          !isCountryAdmin && (
            <ReferenceSelect value={country} onChange={(v) => setCountry(v || '')} fetchOptions={countriesApi.list} placeholder="All countries" />
          )
        }
        columns={columns}
        rows={items}
        status={status}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={`No ${title.toLowerCase()} records yet`}
        actions={(row) => (
          <div className="flex justify-end gap-3 text-sm font-semibold uppercase tracking-wide">
            <Link to={`${basePath}/${row._id}/manage`} className="text-wwm-navy hover:text-wwm-gold">
              Manage
            </Link>
            {canWrite && (
              <RowActions
                editTo={`${basePath}/${row._id}`}
                canDelete
                itemLabel={`this ${title.toLowerCase()} record for "${row.country?.name || 'this country'}"`}
                onDelete={() => api.remove(row._id)}
                onDeleted={refresh}
              />
            )}
          </div>
        )}
      />
    )
  }

  function Form() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const { admin } = useAuth()
    const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
    useDocumentTitle(`${isEdit ? 'Edit' : 'New'} ${title} | World Wide Missions Admin`)
    const navigate = useNavigate()

    const [form, setForm] = useState({
      country: isCountryAdmin ? admin?.country?.id : null,
      current: true,
      historical: false,
      effectiveFromYear: '',
      effectiveToYear: '',
      notes: '',
    })
    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
      if (!isEdit) return
      let cancelled = false
      api
        .get(id)
        .then(({ data }) => {
          if (cancelled) return
          setForm({
            country: data.country?._id || data.country,
            current: data.current,
            historical: Boolean(data.historical),
            effectiveFromYear: data.effectiveFrom?.year ?? '',
            effectiveToYear: data.effectiveTo?.year ?? '',
            notes: data.notes || '',
          })
        })
        .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this record.')))
        .finally(() => !cancelled && setLoading(false))
      return () => {
        cancelled = true
      }
    }, [id, isEdit])

    function update(field, value) {
      setForm((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e) {
      e.preventDefault()
      setSaving(true)
      setError(null)
      const payload = {
        current: form.current,
        historical: form.historical,
        effectiveFrom: form.effectiveFromYear === '' ? undefined : { year: Number(form.effectiveFromYear) },
        effectiveTo: form.effectiveToYear === '' ? undefined : { year: Number(form.effectiveToYear) },
        notes: form.notes || undefined,
      }
      if (!isEdit) payload.country = form.country
      try {
        if (isEdit) await api.update(id, payload)
        else await api.create(payload)
        navigate(basePath)
      } catch (err) {
        setError(errorMessage(err, 'Could not save this record.'))
      } finally {
        setSaving(false)
      }
    }

    if (loading) return <LoadingState label="Loading…" />

    return (
      <FormShell title={isEdit ? `Edit ${title}` : `New ${title}`} backTo={basePath} onSubmit={handleSubmit} error={error} saving={saving}>
        {!isEdit && (
          <FormField label="Country" htmlFor="country" required>
            {isCountryAdmin ? (
              <input disabled className={inputClasses} value={admin?.country?.name || ''} />
            ) : (
              <ReferenceSelect id="country" value={form.country} onChange={(v) => update('country', v)} fetchOptions={countriesApi.list} />
            )}
          </FormField>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Effective from (year)" htmlFor="effectiveFrom">
            <input id="effectiveFrom" type="number" className={inputClasses} value={form.effectiveFromYear} onChange={(e) => update('effectiveFromYear', e.target.value)} />
          </FormField>
          <FormField label="Effective to (year)" htmlFor="effectiveTo" hint="Leave blank if still in effect.">
            <input id="effectiveTo" type="number" className={inputClasses} value={form.effectiveToYear} onChange={(e) => update('effectiveToYear', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Notes" htmlFor="notes">
          <textarea id="notes" rows={3} className={inputClasses} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
        </FormField>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-wwm-neutral-900">
            <input type="checkbox" checked={form.current} onChange={(e) => update('current', e.target.checked)} /> Current structure
          </label>
          <label className="flex items-center gap-2 text-sm text-wwm-neutral-900">
            <input type="checkbox" checked={form.historical} onChange={(e) => update('historical', e.target.checked)} /> Historical record
          </label>
        </div>
        <p className="text-xs text-wwm-neutral-600">
          Only one &quot;current&quot; record is allowed per country. Save this record first, then use &quot;Manage&quot; from the list to add{' '}
          {entryNoun === 'position' ? 'positions' : 'members'}.
        </p>
      </FormShell>
    )
  }

  function Detail() {
    const { id } = useParams()
    useDocumentTitle(`Manage ${title} | World Wide Missions Admin`)
    const { admin } = useAuth()
    const canWrite = WRITE_ROLES.includes(admin?.role)

    const [doc, setDoc] = useState(null)
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState(null)

    function load() {
      setStatus('loading')
      api
        .get(id)
        .then(({ data }) => {
          setDoc(data)
          setStatus('ready')
        })
        .catch(() => setStatus('error'))
    }

    useEffect(() => {
      load()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    if (status === 'loading') return <LoadingState label="Loading…" />
    if (status === 'error' || !doc) {
      return <Alert variant="error">Could not load this record.</Alert>
    }

    const entries = doc[entriesKey] || []

    async function handleSave(payload) {
      if (editingEntry) await updateEntry(id, editingEntry._id, payload)
      else await addEntry(id, payload)
      setModalOpen(false)
      setEditingEntry(null)
      load()
    }

    async function handleRemove(entryId) {
      await removeEntry(id, entryId)
      load()
    }

    return (
      <div>
        <Link to={basePath} className="text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:text-wwm-gold">
          &larr; Back to list
        </Link>
        <h1 className="mt-3 text-xl font-bold uppercase tracking-wide text-wwm-navy">
          {title}: {doc.country?.name || 'Country'}
        </h1>
        <p className="mt-1 text-sm text-wwm-neutral-600">{doc.current ? 'Current structure' : 'Historical structure'}</p>

        <div className="mt-6">
          {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}
          <HierarchyEntryList
            entries={entries}
            entryNoun={entryNoun}
            canWrite={canWrite}
            onAdd={() => {
              setEditingEntry(null)
              setModalOpen(true)
            }}
            onEdit={(entry) => {
              setEditingEntry(entry)
              setModalOpen(true)
            }}
            onRemove={handleRemove}
          />
        </div>

        <HierarchyEntryModal
          open={modalOpen}
          entryNoun={entryNoun}
          entries={entries}
          editing={editingEntry}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false)
            setEditingEntry(null)
          }}
        />
      </div>
    )
  }

  return { List, Form, Detail }
}

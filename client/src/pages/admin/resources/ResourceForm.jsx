import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { resourcesApi, errorMessage } from '../../../services/adminApi.js'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'
import { RESOURCE_TYPE_LABELS } from '../../../lib/format.js'

const EMPTY = { title: '', slug: '', description: '', resourceType: 'other', url: '', status: 'draft', order: 0, notes: '' }

export default function ResourceForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  useDocumentTitle(`${isEdit ? 'Edit' : 'New'} Resource | World Wide Missions Admin`)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    resourcesApi.get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          title: data.title || '', slug: data.slug || '', description: data.description || '',
          resourceType: data.resourceType || 'other', url: data.url || '', status: data.status || 'draft',
          order: data.order ?? 0, notes: data.notes || '',
        })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this resource.')))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [id, isEdit])

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title: form.title, slug: form.slug || undefined, description: form.description,
      resourceType: form.resourceType, url: form.url, status: form.status,
      order: Number(form.order) || 0, notes: form.notes,
    }
    try {
      if (isEdit) await resourcesApi.update(id, payload)
      else await resourcesApi.create(payload)
      navigate('/admin/resources')
    } catch (err) {
      setError(errorMessage(err, 'Could not save this resource.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading resource…" />

  return (
    <FormShell title={isEdit ? 'Edit Resource' : 'New Resource'} backTo="/admin/resources" onSubmit={handleSubmit} error={error} saving={saving}>
      <FormField label="Title" htmlFor="title" required>
        <input id="title" required maxLength={200} className={inputClasses} value={form.title} onChange={(e) => update('title', e.target.value)} />
      </FormField>
      <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate from the title.">
        <input id="slug" className={inputClasses} value={form.slug} onChange={(e) => update('slug', e.target.value)} />
      </FormField>
      <FormField label="Type" htmlFor="resourceType" required>
        <select id="resourceType" className={inputClasses} value={form.resourceType} onChange={(e) => update('resourceType', e.target.value)}>
          {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Link (URL)" htmlFor="url" required hint="An http(s) link to the resource. File uploads arrive with the Cloudinary phase.">
        <input id="url" type="url" required className={inputClasses} value={form.url} onChange={(e) => update('url', e.target.value)} />
      </FormField>
      <FormField label="Description" htmlFor="description">
        <textarea id="description" rows={3} maxLength={2000} className={inputClasses} value={form.description} onChange={(e) => update('description', e.target.value)} />
      </FormField>
      <FormField label="Status" htmlFor="status" hint="Only published resources are visible on the public site.">
        <select id="status" className={inputClasses} value={form.status} onChange={(e) => update('status', e.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </FormField>
      <FormField label="Display order" htmlFor="order">
        <input id="order" type="number" className={inputClasses} value={form.order} onChange={(e) => update('order', e.target.value)} />
      </FormField>
      <FormField label="Internal notes" htmlFor="notes">
        <textarea id="notes" rows={2} className={inputClasses} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </FormField>
    </FormShell>
  )
}

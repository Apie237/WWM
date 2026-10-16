import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { continentsApi, errorMessage } from '../../../services/adminApi.js'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'

const EMPTY = { name: '', slug: '', code: '', description: '', order: 0, isActive: true }

export default function ContinentForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  useDocumentTitle(`${isEdit ? 'Edit' : 'New'} Continent | World Wide Missions Admin`)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    continentsApi
      .get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          code: data.code || '',
          description: data.description || '',
          order: data.order ?? 0,
          isActive: data.isActive,
        })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this continent.')))
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
      name: form.name,
      slug: form.slug || undefined,
      code: form.code || undefined,
      description: form.description || undefined,
      order: Number(form.order) || 0,
      isActive: form.isActive,
    }
    try {
      if (isEdit) await continentsApi.update(id, payload)
      else await continentsApi.create(payload)
      navigate('/admin/continents')
    } catch (err) {
      setError(errorMessage(err, 'Could not save this continent.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading continent…" />

  return (
    <FormShell title={isEdit ? 'Edit Continent' : 'New Continent'} backTo="/admin/continents" onSubmit={handleSubmit} error={error} saving={saving}>
      <FormField label="Name" htmlFor="name" required>
        <input id="name" required className={inputClasses} value={form.name} onChange={(e) => update('name', e.target.value)} />
      </FormField>
      <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate from the name.">
        <input id="slug" className={inputClasses} value={form.slug} onChange={(e) => update('slug', e.target.value)} />
      </FormField>
      <FormField label="Code" htmlFor="code">
        <input id="code" className={inputClasses} value={form.code} onChange={(e) => update('code', e.target.value)} />
      </FormField>
      <FormField label="Description" htmlFor="description">
        <textarea id="description" rows={4} className={inputClasses} value={form.description} onChange={(e) => update('description', e.target.value)} />
      </FormField>
      <FormField label="Display order" htmlFor="order">
        <input id="order" type="number" className={inputClasses} value={form.order} onChange={(e) => update('order', e.target.value)} />
      </FormField>
      <label className="flex items-center gap-2 text-sm font-medium text-wwm-neutral-900">
        <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
        Active (visible on the public site)
      </label>
    </FormShell>
  )
}

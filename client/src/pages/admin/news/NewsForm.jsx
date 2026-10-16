import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { newsApi, countriesApi, errorMessage } from '../../../services/adminApi.js'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'

const EMPTY = { title: '', slug: '', summary: '', body: '', country: null, imageUrl: '', status: 'draft', notes: '' }

export default function NewsForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { admin } = useAuth()
  const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
  useDocumentTitle(`${isEdit ? 'Edit' : 'New'} News | World Wide Missions Admin`)
  const navigate = useNavigate()
  const [form, setForm] = useState(() => (isCountryAdmin ? { ...EMPTY, country: admin?.country?.id } : EMPTY))
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    newsApi.get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          title: data.title || '', slug: data.slug || '', summary: data.summary || '', body: data.body || '',
          country: data.country?._id || data.country || null, imageUrl: data.imageUrl || '', status: data.status || 'draft', notes: data.notes || '',
        })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this article.')))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [id, isEdit])

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    // On edit, blank optional fields are sent as '' so they can be cleared.
    const payload = {
      title: form.title, slug: form.slug || undefined, summary: form.summary, body: form.body,
      country: isCountryAdmin ? admin?.country?.id : form.country || null,
      imageUrl: form.imageUrl, status: form.status, notes: form.notes,
    }
    try {
      if (isEdit) await newsApi.update(id, payload)
      else await newsApi.create(payload)
      navigate('/admin/news')
    } catch (err) {
      setError(errorMessage(err, 'Could not save this article.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading article…" />

  return (
    <FormShell title={isEdit ? 'Edit News Article' : 'New News Article'} backTo="/admin/news" onSubmit={handleSubmit} error={error} saving={saving}>
      <FormField label="Title" htmlFor="title" required>
        <input id="title" required maxLength={200} className={inputClasses} value={form.title} onChange={(e) => update('title', e.target.value)} />
      </FormField>
      <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate from the title.">
        <input id="slug" className={inputClasses} value={form.slug} onChange={(e) => update('slug', e.target.value)} />
      </FormField>
      {!isCountryAdmin && (
        <FormField label="Country" htmlFor="country" hint="Leave unset for international news.">
          <ReferenceSelect id="country" value={form.country} onChange={(v) => update('country', v)} fetchOptions={countriesApi.list} placeholder="International (no country)" />
        </FormField>
      )}
      <FormField label="Summary" htmlFor="summary" hint="Shown on cards (max 500 characters).">
        <textarea id="summary" rows={2} maxLength={500} className={inputClasses} value={form.summary} onChange={(e) => update('summary', e.target.value)} />
      </FormField>
      <FormField label="Body" htmlFor="body" hint="Plain text. Separate paragraphs with a blank line.">
        <textarea id="body" rows={10} maxLength={20000} className={inputClasses} value={form.body} onChange={(e) => update('body', e.target.value)} />
      </FormField>
      <FormField label="Image URL" htmlFor="imageUrl" hint="Optional http(s) link. Uploads arrive with the Cloudinary phase.">
        <input id="imageUrl" type="url" className={inputClasses} value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} />
      </FormField>
      <FormField label="Status" htmlFor="status" hint="Only published articles are visible on the public site.">
        <select id="status" className={inputClasses} value={form.status} onChange={(e) => update('status', e.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </FormField>
      <FormField label="Internal notes" htmlFor="notes">
        <textarea id="notes" rows={2} className={inputClasses} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </FormField>
    </FormShell>
  )
}

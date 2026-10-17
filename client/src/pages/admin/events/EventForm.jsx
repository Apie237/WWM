import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { eventsApi, countriesApi, errorMessage } from '../../../services/adminApi.js'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import ImageUpload from '../../../components/admin/cms/ImageUpload.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'

const EMPTY = { title: '', slug: '', description: '', country: null, location: '', startDate: '', endDate: '', imageUrl: '', imagePublicId: '', status: 'draft', notes: '' }

// <input type="date"> works in YYYY-MM-DD; the API stores a full date.
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export default function EventForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { admin } = useAuth()
  const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
  useDocumentTitle(`${isEdit ? 'Edit' : 'New'} Event | World Wide Missions Admin`)
  const navigate = useNavigate()
  const [form, setForm] = useState(() => (isCountryAdmin ? { ...EMPTY, country: admin?.country?.id } : EMPTY))
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    eventsApi.get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          title: data.title || '', slug: data.slug || '', description: data.description || '',
          country: data.country?._id || data.country || null, location: data.location || '',
          startDate: toDateInput(data.startDate), endDate: toDateInput(data.endDate),
          imageUrl: data.imageUrl || '', imagePublicId: data.imagePublicId || '', status: data.status || 'draft', notes: data.notes || '',
        })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this event.')))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [id, isEdit])

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title: form.title, slug: form.slug || undefined, description: form.description, location: form.location,
      country: isCountryAdmin ? admin?.country?.id : form.country || null,
      startDate: form.startDate, endDate: form.endDate || null,
      imageUrl: form.imageUrl, imagePublicId: form.imagePublicId || null, status: form.status, notes: form.notes,
    }
    try {
      if (isEdit) await eventsApi.update(id, payload)
      else await eventsApi.create(payload)
      navigate('/admin/events')
    } catch (err) {
      setError(errorMessage(err, 'Could not save this event.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading event…" />

  return (
    <FormShell title={isEdit ? 'Edit Event' : 'New Event'} backTo="/admin/events" onSubmit={handleSubmit} error={error} saving={saving}>
      <FormField label="Title" htmlFor="title" required>
        <input id="title" required maxLength={200} className={inputClasses} value={form.title} onChange={(e) => update('title', e.target.value)} />
      </FormField>
      <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate from the title.">
        <input id="slug" className={inputClasses} value={form.slug} onChange={(e) => update('slug', e.target.value)} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Start date" htmlFor="startDate" required>
          <input id="startDate" type="date" required className={inputClasses} value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
        </FormField>
        <FormField label="End date" htmlFor="endDate" hint="Optional; must not be before the start date.">
          <input id="endDate" type="date" className={inputClasses} value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Location" htmlFor="location" hint="Venue/city as free text. Do not enter an address you have not verified.">
        <input id="location" maxLength={300} className={inputClasses} value={form.location} onChange={(e) => update('location', e.target.value)} />
      </FormField>
      {!isCountryAdmin && (
        <FormField label="Country" htmlFor="country" hint="Leave unset for an international event.">
          <ReferenceSelect id="country" value={form.country} onChange={(v) => update('country', v)} fetchOptions={countriesApi.list} placeholder="International (no country)" />
        </FormField>
      )}
      <FormField label="Description" htmlFor="description" hint="Plain text. Separate paragraphs with a blank line.">
        <textarea id="description" rows={8} maxLength={10000} className={inputClasses} value={form.description} onChange={(e) => update('description', e.target.value)} />
      </FormField>
      <FormField label="Image" htmlFor="imageUrl">
        <ImageUpload id="imageUrl" kind="events" value={{ url: form.imageUrl, publicId: form.imagePublicId }} onChange={(v) => setForm((p) => ({ ...p, imageUrl: v.url, imagePublicId: v.publicId }))} />
      </FormField>
      <FormField label="Status" htmlFor="status" hint="Only published events are visible on the public site.">
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

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { historyApi, peopleApi, countriesApi, errorMessage } from '../../../services/adminApi.js'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import ImageUpload from '../../../components/admin/cms/ImageUpload.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'
import { HISTORY_SECTION_LABELS, HISTORY_ENTRY_TYPE_LABELS, HISTORY_REVIEW_LABELS } from '../../../lib/history.js'

const EMPTY = {
  section: 'origins', entryType: 'event', title: '', subtitle: '', dateLabel: '', year: '', approximateDate: false,
  historical: true, location: '', description: '', people: [], country: null, source: '',
  imageUrl: '', imagePublicId: '', imageAlt: '', imageCaption: '', order: 0, status: 'draft',
  reviewStatus: 'unreviewed', reviewNote: '', notes: '',
}

const WRITE_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'CONTENT_EDITOR']

export default function HistoryForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { admin } = useAuth()
  const readOnly = !WRITE_ROLES.includes(admin?.role)
  useDocumentTitle(`${isEdit ? 'Edit' : 'New'} History Entry | World Wide Missions Admin`)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    historyApi.get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          ...EMPTY,
          ...Object.fromEntries(
            ['section', 'entryType', 'title', 'subtitle', 'dateLabel', 'location', 'description', 'source', 'imageUrl', 'imagePublicId', 'imageAlt', 'imageCaption', 'status', 'reviewStatus', 'reviewNote', 'notes']
              .map((k) => [k, data[k] || EMPTY[k]]),
          ),
          year: data.year ?? '',
          approximateDate: Boolean(data.approximateDate),
          historical: data.historical !== false,
          order: data.order ?? 0,
          people: (data.people || []).map((p) => p._id || p),
          country: data.country?._id || data.country || null,
        })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this entry.')))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [id, isEdit])

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))
  const setPerson = (index, value) => setForm((prev) => ({ ...prev, people: prev.people.map((p, i) => (i === index ? value : p)) }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    // Blank optional fields are sent as '' / null so they can be cleared on edit.
    const payload = {
      section: form.section, entryType: form.entryType, title: form.title, subtitle: form.subtitle,
      description: form.description, dateLabel: form.dateLabel, year: form.year === '' ? '' : Number(form.year),
      approximateDate: form.approximateDate, historical: form.historical, location: form.location,
      people: form.people.filter(Boolean), country: form.country || null, source: form.source,
      imageUrl: form.imageUrl, imagePublicId: form.imagePublicId || null, imageAlt: form.imageAlt, imageCaption: form.imageCaption,
      order: Number(form.order) || 0, status: form.status,
      reviewStatus: form.reviewStatus, reviewNote: form.reviewNote, notes: form.notes,
    }
    try {
      if (isEdit) await historyApi.update(id, payload)
      else await historyApi.create(payload)
      navigate('/admin/history')
    } catch (err) {
      setError(errorMessage(err, 'Could not save this entry.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading history entry…" />

  return (
    <FormShell title={isEdit ? 'Edit History Entry' : 'New History Entry'} backTo="/admin/history" onSubmit={handleSubmit} error={error || (readOnly ? 'Your role can view history entries but not change them.' : null)} saving={saving}>
      <FormField label="Page section" htmlFor="section" required hint="Where this appears on the public History page.">
        <select id="section" className={inputClasses} value={form.section} onChange={(e) => update('section', e.target.value)}>
          {Object.entries(HISTORY_SECTION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Entry type" htmlFor="entryType" hint="Records show in the historical-records panel; “pending” entries are kept for the editors and are not shown on the public page.">
        <select id="entryType" className={inputClasses} value={form.entryType} onChange={(e) => update('entryType', e.target.value)}>
          {Object.entries(HISTORY_ENTRY_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Title" htmlFor="title" required>
        <input id="title" required maxLength={200} className={inputClasses} value={form.title} onChange={(e) => update('title', e.target.value)} />
      </FormField>
      <FormField label="Subtitle / role" htmlFor="subtitle">
        <input id="subtitle" maxLength={200} className={inputClasses} value={form.subtitle} onChange={(e) => update('subtitle', e.target.value)} />
      </FormField>
      <FormField label="Description" htmlFor="description" hint="Plain text. Separate paragraphs with a blank line; line breaks are kept for records. Word claims as the source states them.">
        <textarea id="description" rows={7} maxLength={5000} className={inputClasses} value={form.description} onChange={(e) => update('description', e.target.value)} />
      </FormField>

      <fieldset className="flex flex-col gap-4 border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Photograph (upload an image)</legend>
        <p className="text-xs text-wwm-neutral-600">Optional. Shown beside this entry on the public History page once it is published.</p>
        <ImageUpload
          id="imageUrl"
          kind="history"
          value={{ url: form.imageUrl, publicId: form.imagePublicId }}
          onChange={(v) => setForm((p) => ({ ...p, imageUrl: v.url, imagePublicId: v.publicId }))}
          disabled={readOnly}
        />
        <FormField label="Alternative text" htmlFor="imageAlt" hint="Describe the photograph for screen-reader users, e.g. “Bearl and Virginia Smalldridge as a young couple”.">
          <input id="imageAlt" maxLength={300} className={inputClasses} value={form.imageAlt} onChange={(e) => update('imageAlt', e.target.value)} />
        </FormField>
        <FormField label="Caption" htmlFor="imageCaption">
          <input id="imageCaption" maxLength={300} className={inputClasses} value={form.imageCaption} onChange={(e) => update('imageCaption', e.target.value)} />
        </FormField>
      </fieldset>

      <fieldset className="grid gap-4 border border-wwm-neutral-300 p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Date and place</legend>
        <FormField label="Date as shown" htmlFor="dateLabel" hint="Exactly how it should read, e.g. “1960s” or “1985–2021”.">
          <input id="dateLabel" maxLength={80} className={inputClasses} value={form.dateLabel} onChange={(e) => update('dateLabel', e.target.value)} />
        </FormField>
        <FormField label="Year (for ordering only)" htmlFor="year">
          <input id="year" type="number" min={0} max={2200} className={inputClasses} value={form.year} onChange={(e) => update('year', e.target.value)} />
        </FormField>
        <label className="flex items-center gap-2 text-sm font-medium text-wwm-neutral-900">
          <input type="checkbox" checked={form.approximateDate} onChange={(e) => update('approximateDate', e.target.checked)} />
          Date is approximate (shown as “c.”)
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-wwm-neutral-900">
          <input type="checkbox" checked={form.historical} onChange={(e) => update('historical', e.target.checked)} />
          Historical (not current)
        </label>
        <FormField label="Location" htmlFor="location">
          <input id="location" maxLength={200} className={inputClasses} value={form.location} onChange={(e) => update('location', e.target.value)} />
        </FormField>
        <FormField label="Country (optional)" htmlFor="country" hint="Links the entry to a country’s own mission history.">
          <ReferenceSelect id="country" value={form.country} onChange={(v) => update('country', v)} fetchOptions={countriesApi.list} placeholder="None" />
        </FormField>
      </fieldset>

      <fieldset className="flex flex-col gap-3 border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">People</legend>
        <p className="text-xs text-wwm-neutral-600">
          Linked people supply the portrait when this entry has no photograph of its own (only if exactly one person is linked).
          Add the person under Admin → People first.
        </p>
        {form.people.map((personId, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <ReferenceSelect
                id={`person-${index}`}
                value={personId}
                onChange={(v) => setPerson(index, v)}
                fetchOptions={peopleApi.list}
                getLabel={(p) => p.displayName}
                placeholder="Select a person…"
              />
            </div>
            <button
              type="button"
              aria-label={`Remove person ${index + 1}`}
              onClick={() => update('people', form.people.filter((_, i) => i !== index))}
              className="inline-flex min-h-[44px] items-center border border-wwm-neutral-300 px-3 text-red-700 hover:bg-wwm-neutral-100 focus-visible:outline-2 focus-visible:outline-wwm-gold"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        {form.people.length < 20 && (
          <button
            type="button"
            onClick={() => update('people', [...form.people, ''])}
            className="inline-flex min-h-[44px] w-fit items-center gap-1.5 border border-wwm-navy px-3 text-sm font-semibold text-wwm-navy hover:bg-wwm-neutral-100 focus-visible:outline-2 focus-visible:outline-wwm-gold"
          >
            <Plus size={16} aria-hidden="true" /> Add person
          </button>
        )}
      </fieldset>

      <FormField label="Source (internal — not shown on the public site)" htmlFor="source" hint="Where this information came from, for the editorial team, e.g. “Founder-supplied notes”. It is kept with the entry but never displayed to visitors.">
        <input id="source" maxLength={500} className={inputClasses} value={form.source} onChange={(e) => update('source', e.target.value)} />
      </FormField>
      <FormField label="Display order" htmlFor="order" hint="Lower numbers appear first within the section.">
        <input id="order" type="number" className={inputClasses} value={form.order} onChange={(e) => update('order', e.target.value)} />
      </FormField>
      <FormField label="Status" htmlFor="status" hint="Only published entries appear on the public site.">
        <select id="status" className={inputClasses} value={form.status} onChange={(e) => update('status', e.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </FormField>

      <fieldset className="flex flex-col gap-4 border border-wwm-gold bg-wwm-neutral-100 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Editorial review — private, never shown publicly</legend>
        <FormField label="Review status" htmlFor="reviewStatus">
          <select id="reviewStatus" className={inputClasses} value={form.reviewStatus} onChange={(e) => update('reviewStatus', e.target.value)}>
            {Object.entries(HISTORY_REVIEW_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </FormField>
        <FormField label="What needs confirming" htmlFor="reviewNote">
          <textarea id="reviewNote" rows={4} maxLength={1000} className={inputClasses} value={form.reviewNote} onChange={(e) => update('reviewNote', e.target.value)} />
        </FormField>
        <FormField label="Internal notes" htmlFor="notes">
          <textarea id="notes" rows={2} maxLength={1000} className={inputClasses} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
        </FormField>
      </fieldset>
    </FormShell>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { ministriesApi, countriesApi, organizationsApi, peopleApi, errorMessage } from '../../../services/adminApi.js'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'
import { MINISTRY_TYPES } from './ministryTypes.js'

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  ministryType: MINISTRY_TYPES[MINISTRY_TYPES.length - 1],
  country: null,
  organization: null,
  isActive: true,
  historical: false,
  order: 0,
  notes: '',
  responsiblePeople: [],
}

export default function MinistryForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { admin } = useAuth()
  const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
  useDocumentTitle(`${isEdit ? 'Edit' : 'New'} Ministry | World Wide Missions Admin`)
  const navigate = useNavigate()

  const [form, setForm] = useState(() => (isCountryAdmin ? { ...EMPTY, country: admin?.country?.id } : EMPTY))
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    ministriesApi
      .get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          ministryType: data.ministryType || 'other',
          country: data.country?._id || data.country || null,
          organization: data.organization?._id || data.organization || null,
          isActive: data.isActive,
          historical: Boolean(data.historical),
          order: data.order ?? 0,
          notes: data.notes || '',
          responsiblePeople: (data.responsiblePeople || []).map((p) => ({ person: p.person?._id || p.person || null, role: p.role || '' })),
        })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this ministry.')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }
  function updatePerson(index, field, value) {
    setForm((prev) => ({ ...prev, responsiblePeople: prev.responsiblePeople.map((p, i) => (i === index ? { ...p, [field]: value } : p)) }))
  }
  function addPerson() {
    setForm((prev) => ({ ...prev, responsiblePeople: [...prev.responsiblePeople, { person: null, role: '' }] }))
  }
  function removePerson(index) {
    setForm((prev) => ({ ...prev, responsiblePeople: prev.responsiblePeople.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || undefined,
      ministryType: form.ministryType,
      country: isCountryAdmin ? admin?.country?.id : form.country || undefined,
      organization: form.organization || undefined,
      isActive: form.isActive,
      historical: form.historical,
      order: Number(form.order) || 0,
      notes: form.notes || undefined,
      responsiblePeople: form.responsiblePeople.filter((p) => p.person).map((p) => ({ person: p.person, role: p.role || undefined })),
    }

    try {
      if (isEdit) await ministriesApi.update(id, payload)
      else await ministriesApi.create(payload)
      navigate('/admin/ministries')
    } catch (err) {
      setError(errorMessage(err, 'Could not save this ministry.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading ministry…" />

  return (
    <FormShell title={isEdit ? 'Edit Ministry' : 'New Ministry'} backTo="/admin/ministries" onSubmit={handleSubmit} error={error} saving={saving}>
      <FormField label="Name" htmlFor="name" required>
        <input id="name" required className={inputClasses} value={form.name} onChange={(e) => update('name', e.target.value)} />
      </FormField>
      <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate from the name.">
        <input id="slug" className={inputClasses} value={form.slug} onChange={(e) => update('slug', e.target.value)} />
      </FormField>
      <FormField label="Ministry type" htmlFor="ministryType" required>
        <select id="ministryType" className={inputClasses} value={form.ministryType} onChange={(e) => update('ministryType', e.target.value)}>
          {MINISTRY_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </FormField>
      {!isCountryAdmin && (
        <FormField label="Country" htmlFor="country" hint="Leave unset for an internationally-scoped ministry.">
          <ReferenceSelect id="country" value={form.country} onChange={(v) => update('country', v)} fetchOptions={countriesApi.list} placeholder="International (no country)" />
        </FormField>
      )}
      <FormField label="Organization" htmlFor="organization" hint="Optional — link this ministry to a specific church or institution.">
        <ReferenceSelect id="organization" value={form.organization} onChange={(v) => update('organization', v)} fetchOptions={organizationsApi.list} placeholder="None" params={form.country ? { country: form.country } : undefined} />
      </FormField>
      <FormField label="Description" htmlFor="description">
        <textarea id="description" rows={4} className={inputClasses} value={form.description} onChange={(e) => update('description', e.target.value)} />
      </FormField>

      <fieldset className="border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Responsible people</legend>
        <div className="flex flex-col gap-3">
          {form.responsiblePeople.map((p, index) => (
            <div key={index} className="grid gap-3 border border-wwm-neutral-300 p-3 sm:grid-cols-[2fr_2fr_auto]">
              <ReferenceSelect value={p.person} onChange={(v) => updatePerson(index, 'person', v)} fetchOptions={peopleApi.list} getLabel={(item) => item.displayName} placeholder="Select person" />
              <input placeholder="Role" className={inputClasses} value={p.role} onChange={(e) => updatePerson(index, 'role', e.target.value)} />
              <button type="button" onClick={() => removePerson(index)} aria-label="Remove person" className="text-red-700 hover:text-red-900">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addPerson} className="mt-3 inline-flex items-center gap-2 border border-wwm-neutral-300 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-neutral-100">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add person
        </button>
      </fieldset>

      <FormField label="Display order" htmlFor="order">
        <input id="order" type="number" className={inputClasses} value={form.order} onChange={(e) => update('order', e.target.value)} />
      </FormField>
      <FormField label="Internal notes" htmlFor="notes">
        <textarea id="notes" rows={3} className={inputClasses} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </FormField>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-wwm-neutral-900">
          <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} /> Active
        </label>
        <label className="flex items-center gap-2 text-sm text-wwm-neutral-900">
          <input type="checkbox" checked={form.historical} onChange={(e) => update('historical', e.target.checked)} /> Historical record
        </label>
      </div>
    </FormShell>
  )
}

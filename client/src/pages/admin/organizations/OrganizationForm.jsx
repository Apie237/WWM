import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { organizationsApi, countriesApi, peopleApi, errorMessage } from '../../../services/adminApi.js'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'
import { ORGANIZATION_TYPES } from './organizationTypes.js'

const EMPTY = {
  name: '',
  slug: '',
  type: ORGANIZATION_TYPES[0],
  description: '',
  country: null,
  region: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  establishedYear: '',
  establishedApprox: false,
  isActive: true,
  historical: false,
  order: 0,
  notes: '',
  leaders: [],
}

export default function OrganizationForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { admin } = useAuth()
  const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
  useDocumentTitle(`${isEdit ? 'Edit' : 'New'} Organization | World Wide Missions Admin`)
  const navigate = useNavigate()

  const [form, setForm] = useState(() => (isCountryAdmin ? { ...EMPTY, country: admin?.country?.id } : EMPTY))
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    organizationsApi
      .get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          type: data.type,
          description: data.description || '',
          country: data.country?._id || data.country || null,
          region: data.location?.region || '',
          city: data.location?.city || '',
          address: data.location?.address || '',
          phone: data.contact?.phone || '',
          email: data.contact?.email || '',
          website: data.contact?.website || '',
          establishedYear: data.established?.year ?? '',
          establishedApprox: Boolean(data.established?.approximate),
          isActive: data.isActive,
          historical: Boolean(data.historical),
          order: data.order ?? 0,
          notes: data.notes || '',
          leaders: (data.leaders || []).map((l) => ({ person: l.person?._id || l.person || null, role: l.role || '' })),
        })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this organization.')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }
  function updateLeader(index, field, value) {
    setForm((prev) => ({ ...prev, leaders: prev.leaders.map((l, i) => (i === index ? { ...l, [field]: value } : l)) }))
  }
  function addLeader() {
    setForm((prev) => ({ ...prev, leaders: [...prev.leaders, { person: null, role: '' }] }))
  }
  function removeLeader(index) {
    setForm((prev) => ({ ...prev, leaders: prev.leaders.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      type: form.type,
      description: form.description || undefined,
      country: isCountryAdmin ? admin?.country?.id : form.country,
      location: { region: form.region || undefined, city: form.city || undefined, address: form.address || undefined },
      contact: { phone: form.phone || undefined, email: form.email || undefined, website: form.website || undefined },
      established:
        form.establishedYear === '' ? undefined : { year: Number(form.establishedYear), approximate: form.establishedApprox },
      isActive: form.isActive,
      historical: form.historical,
      order: Number(form.order) || 0,
      notes: form.notes || undefined,
      leaders: form.leaders.filter((l) => l.person).map((l) => ({ person: l.person, role: l.role || undefined })),
    }

    try {
      if (isEdit) await organizationsApi.update(id, payload)
      else await organizationsApi.create(payload)
      navigate('/admin/organizations')
    } catch (err) {
      setError(errorMessage(err, 'Could not save this organization.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading organization…" />

  return (
    <FormShell title={isEdit ? 'Edit Organization' : 'New Organization'} backTo="/admin/organizations" onSubmit={handleSubmit} error={error} saving={saving}>
      <FormField label="Name" htmlFor="name" required>
        <input id="name" required className={inputClasses} value={form.name} onChange={(e) => update('name', e.target.value)} />
      </FormField>
      <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate from the name.">
        <input id="slug" className={inputClasses} value={form.slug} onChange={(e) => update('slug', e.target.value)} />
      </FormField>
      <FormField label="Type" htmlFor="type" required>
        <select id="type" className={inputClasses} value={form.type} onChange={(e) => update('type', e.target.value)}>
          {ORGANIZATION_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </FormField>
      {!isCountryAdmin && (
        <FormField label="Country" htmlFor="country" required>
          <ReferenceSelect id="country" value={form.country} onChange={(v) => update('country', v)} fetchOptions={countriesApi.list} />
        </FormField>
      )}
      <FormField label="Description" htmlFor="description">
        <textarea id="description" rows={4} className={inputClasses} value={form.description} onChange={(e) => update('description', e.target.value)} />
      </FormField>

      <fieldset className="border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Location</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Region" htmlFor="region"><input id="region" className={inputClasses} value={form.region} onChange={(e) => update('region', e.target.value)} /></FormField>
          <FormField label="City" htmlFor="city"><input id="city" className={inputClasses} value={form.city} onChange={(e) => update('city', e.target.value)} /></FormField>
          <FormField label="Address" htmlFor="address"><input id="address" className={inputClasses} value={form.address} onChange={(e) => update('address', e.target.value)} /></FormField>
        </div>
      </fieldset>

      <fieldset className="border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Contact</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Phone" htmlFor="phone"><input id="phone" className={inputClasses} value={form.phone} onChange={(e) => update('phone', e.target.value)} /></FormField>
          <FormField label="Email" htmlFor="email"><input id="email" type="email" className={inputClasses} value={form.email} onChange={(e) => update('email', e.target.value)} /></FormField>
          <FormField label="Website" htmlFor="website"><input id="website" className={inputClasses} value={form.website} onChange={(e) => update('website', e.target.value)} /></FormField>
        </div>
      </fieldset>

      <fieldset className="border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Leaders</legend>
        <div className="flex flex-col gap-3">
          {form.leaders.map((leader, index) => (
            <div key={index} className="grid gap-3 border border-wwm-neutral-300 p-3 sm:grid-cols-[2fr_2fr_auto]">
              <ReferenceSelect value={leader.person} onChange={(v) => updateLeader(index, 'person', v)} fetchOptions={peopleApi.list} getLabel={(p) => p.displayName} placeholder="Select person" />
              <input placeholder="Role (e.g. Pastor)" className={inputClasses} value={leader.role} onChange={(e) => updateLeader(index, 'role', e.target.value)} />
              <button type="button" onClick={() => removeLeader(index)} aria-label="Remove leader" className="text-red-700 hover:text-red-900">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLeader} className="mt-3 inline-flex items-center gap-2 border border-wwm-neutral-300 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-neutral-100">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add leader
        </button>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Established (year)" htmlFor="establishedYear">
          <input id="establishedYear" type="number" className={inputClasses} value={form.establishedYear} onChange={(e) => update('establishedYear', e.target.value)} />
        </FormField>
        <label className="flex items-center gap-2 self-end text-sm text-wwm-neutral-900">
          <input type="checkbox" checked={form.establishedApprox} onChange={(e) => update('establishedApprox', e.target.checked)} /> Approximate
        </label>
      </div>

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

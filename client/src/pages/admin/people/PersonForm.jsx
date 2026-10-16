import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { peopleApi, countriesApi, organizationsApi, errorMessage } from '../../../services/adminApi.js'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'

// Mirrors server/src/models/enums.js PERSON_ROLE_TYPES — a fixed UI
// classification list, not organizational data, so duplicating it here (as
// the project's own backend enum file already does for its own purposes)
// does not violate "never invent WWM organizational facts".
const ROLE_TYPES = [
  'founder',
  'missionary',
  'pastor',
  'superintendent',
  'administrator',
  'board_member',
  'national_leader',
  'teacher',
  'director',
  'other',
]

function emptyRole(countryId) {
  return { roleType: 'other', title: '', country: countryId || null, organization: null, startYear: '', endYear: '', current: true, notes: '' }
}

const EMPTY = {
  displayName: '',
  prefix: '',
  first: '',
  middle: '',
  last: '',
  suffix: '',
  slug: '',
  biography: '',
  photoUrl: '',
  bornYear: '',
  bornApprox: false,
  diedYear: '',
  diedApprox: false,
  isActive: true,
  order: 0,
  notes: '',
  roles: [],
}

export default function PersonForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { admin } = useAuth()
  const isCountryAdmin = admin?.role === 'COUNTRY_ADMIN'
  useDocumentTitle(`${isEdit ? 'Edit' : 'New'} Person | World Wide Missions Admin`)
  const navigate = useNavigate()

  const [form, setForm] = useState(() => (isCountryAdmin ? { ...EMPTY, roles: [emptyRole(admin?.country?.id)] } : EMPTY))
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    peopleApi
      .get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          displayName: data.displayName || '',
          prefix: data.name?.prefix || '',
          first: data.name?.first || '',
          middle: data.name?.middle || '',
          last: data.name?.last || '',
          suffix: data.name?.suffix || '',
          slug: data.slug || '',
          biography: data.biography || '',
          photoUrl: data.photoUrl || '',
          bornYear: data.lifeDates?.born?.year ?? '',
          bornApprox: Boolean(data.lifeDates?.born?.approximate),
          diedYear: data.lifeDates?.died?.year ?? '',
          diedApprox: Boolean(data.lifeDates?.died?.approximate),
          isActive: data.isActive,
          order: data.order ?? 0,
          notes: data.notes || '',
          roles: (data.roles || []).map((r) => ({
            roleType: r.roleType || 'other',
            title: r.title || '',
            country: r.country?._id || r.country || null,
            organization: r.organization?._id || r.organization || null,
            startYear: r.start?.year ?? '',
            endYear: r.end?.year ?? '',
            current: r.current ?? true,
            notes: r.notes || '',
          })),
        })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this person.')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }
  function updateRole(index, field, value) {
    setForm((prev) => ({ ...prev, roles: prev.roles.map((r, i) => (i === index ? { ...r, [field]: value } : r)) }))
  }
  function addRole() {
    setForm((prev) => ({ ...prev, roles: [...prev.roles, emptyRole(isCountryAdmin ? admin?.country?.id : null)] }))
  }
  function removeRole(index) {
    setForm((prev) => ({ ...prev, roles: prev.roles.filter((_, i) => i !== index) }))
  }

  function looseYear(year, approximate) {
    if (year === '' || year === null || year === undefined) return undefined
    return { year: Number(year), approximate: Boolean(approximate) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (isCountryAdmin && form.roles.length === 0) {
      setError('As a country administrator, you must add at least one role for this person.')
      setSaving(false)
      return
    }

    const payload = {
      displayName: form.displayName,
      name: { prefix: form.prefix || undefined, first: form.first || undefined, middle: form.middle || undefined, last: form.last || undefined, suffix: form.suffix || undefined },
      slug: form.slug || undefined,
      biography: form.biography || undefined,
      photoUrl: form.photoUrl || undefined,
      lifeDates: {
        born: looseYear(form.bornYear, form.bornApprox),
        died: looseYear(form.diedYear, form.diedApprox),
      },
      isActive: form.isActive,
      order: Number(form.order) || 0,
      notes: form.notes || undefined,
      roles: form.roles.map((r) => ({
        roleType: r.roleType,
        title: r.title,
        country: isCountryAdmin ? admin?.country?.id : r.country || undefined,
        organization: r.organization || undefined,
        start: looseYear(r.startYear),
        end: looseYear(r.endYear),
        current: r.current,
        notes: r.notes || undefined,
      })),
    }

    try {
      if (isEdit) await peopleApi.update(id, payload)
      else await peopleApi.create(payload)
      navigate('/admin/people')
    } catch (err) {
      setError(errorMessage(err, 'Could not save this person.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading person…" />

  return (
    <FormShell title={isEdit ? 'Edit Person' : 'New Person'} backTo="/admin/people" onSubmit={handleSubmit} error={error} saving={saving}>
      <FormField label="Display name" htmlFor="displayName" required>
        <input id="displayName" required className={inputClasses} value={form.displayName} onChange={(e) => update('displayName', e.target.value)} />
      </FormField>

      <fieldset className="border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Name parts (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Prefix" htmlFor="prefix"><input id="prefix" className={inputClasses} value={form.prefix} onChange={(e) => update('prefix', e.target.value)} /></FormField>
          <FormField label="First" htmlFor="first"><input id="first" className={inputClasses} value={form.first} onChange={(e) => update('first', e.target.value)} /></FormField>
          <FormField label="Middle" htmlFor="middle"><input id="middle" className={inputClasses} value={form.middle} onChange={(e) => update('middle', e.target.value)} /></FormField>
          <FormField label="Last" htmlFor="last"><input id="last" className={inputClasses} value={form.last} onChange={(e) => update('last', e.target.value)} /></FormField>
          <FormField label="Suffix" htmlFor="suffix"><input id="suffix" className={inputClasses} value={form.suffix} onChange={(e) => update('suffix', e.target.value)} /></FormField>
        </div>
      </fieldset>

      <FormField label="Biography" htmlFor="biography">
        <textarea id="biography" rows={4} className={inputClasses} value={form.biography} onChange={(e) => update('biography', e.target.value)} />
      </FormField>
      <FormField label="Photo URL" htmlFor="photoUrl">
        <input id="photoUrl" className={inputClasses} value={form.photoUrl} onChange={(e) => update('photoUrl', e.target.value)} />
      </FormField>

      <fieldset className="border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Life dates (optional, approximate allowed)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormField label="Born (year)" htmlFor="bornYear"><input id="bornYear" type="number" className={inputClasses} value={form.bornYear} onChange={(e) => update('bornYear', e.target.value)} /></FormField>
            <label className="mt-1 flex items-center gap-2 text-sm text-wwm-neutral-900"><input type="checkbox" checked={form.bornApprox} onChange={(e) => update('bornApprox', e.target.checked)} /> Approximate</label>
          </div>
          <div>
            <FormField label="Died (year)" htmlFor="diedYear"><input id="diedYear" type="number" className={inputClasses} value={form.diedYear} onChange={(e) => update('diedYear', e.target.value)} /></FormField>
            <label className="mt-1 flex items-center gap-2 text-sm text-wwm-neutral-900"><input type="checkbox" checked={form.diedApprox} onChange={(e) => update('diedApprox', e.target.checked)} /> Approximate</label>
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Roles</legend>
        {isCountryAdmin && (
          <p className="mb-3 text-xs text-wwm-neutral-600">Every role you add is automatically scoped to {admin?.country?.name}.</p>
        )}
        <div className="flex flex-col gap-4">
          {form.roles.map((role, index) => (
            <div key={index} className="border border-wwm-neutral-300 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Role type" htmlFor={`roleType-${index}`}>
                  <select id={`roleType-${index}`} className={inputClasses} value={role.roleType} onChange={(e) => updateRole(index, 'roleType', e.target.value)}>
                    {ROLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Title" htmlFor={`title-${index}`} required>
                  <input id={`title-${index}`} required className={inputClasses} value={role.title} onChange={(e) => updateRole(index, 'title', e.target.value)} />
                </FormField>
                {!isCountryAdmin && (
                  <FormField label="Country" htmlFor={`country-${index}`} hint="Leave unset for an internationally-scoped role.">
                    <ReferenceSelect id={`country-${index}`} value={role.country} onChange={(v) => updateRole(index, 'country', v)} fetchOptions={countriesApi.list} placeholder="International (no country)" />
                  </FormField>
                )}
                <FormField label="Organization" htmlFor={`organization-${index}`} hint="Optional.">
                  <ReferenceSelect
                    id={`organization-${index}`}
                    value={role.organization}
                    onChange={(v) => updateRole(index, 'organization', v)}
                    fetchOptions={organizationsApi.list}
                    placeholder="None"
                    params={role.country ? { country: role.country } : undefined}
                  />
                </FormField>
                <FormField label="Start (year)" htmlFor={`start-${index}`}>
                  <input id={`start-${index}`} type="number" className={inputClasses} value={role.startYear} onChange={(e) => updateRole(index, 'startYear', e.target.value)} />
                </FormField>
                <FormField label="End (year)" htmlFor={`end-${index}`}>
                  <input id={`end-${index}`} type="number" className={inputClasses} value={role.endYear} onChange={(e) => updateRole(index, 'endYear', e.target.value)} />
                </FormField>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-wwm-neutral-900">
                <input type="checkbox" checked={role.current} onChange={(e) => updateRole(index, 'current', e.target.checked)} /> Current role
              </label>
              <button type="button" onClick={() => removeRole(index)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-red-700 hover:text-red-900">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove role
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRole} className="mt-3 inline-flex items-center gap-2 border border-wwm-neutral-300 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-neutral-100">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add role
        </button>
      </fieldset>

      <FormField label="Internal notes" htmlFor="notes">
        <textarea id="notes" rows={3} className={inputClasses} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </FormField>
      <FormField label="Display order" htmlFor="order">
        <input id="order" type="number" className={inputClasses} value={form.order} onChange={(e) => update('order', e.target.value)} />
      </FormField>
      <label className="flex items-center gap-2 text-sm font-medium text-wwm-neutral-900">
        <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
        Active
      </label>
    </FormShell>
  )
}

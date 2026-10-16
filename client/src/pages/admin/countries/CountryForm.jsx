import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js'
import { countriesApi, continentsApi, errorMessage } from '../../../services/adminApi.js'
import FormShell from '../../../components/admin/cms/FormShell.jsx'
import FormField, { inputClasses } from '../../../components/admin/cms/FormField.jsx'
import ReferenceSelect from '../../../components/admin/cms/ReferenceSelect.jsx'
import LoadingState from '../../../components/ui/LoadingState.jsx'

const EMPTY = {
  name: '',
  slug: '',
  isoCode: '',
  continent: null,
  overview: '',
  flagImageUrl: '',
  isActive: true,
  order: 0,
  contact: { headquartersAddress: '', mailingAddress: '', phone: '', email: '' },
}

// A COUNTRY_ADMIN may only edit their own country's descriptive content —
// never its name, slug, continent, iso code, order, or active status
// (server/src/services/admin/countryAdminService.js's COUNTRY_CONTENT_ONLY_FIELDS).
// This form hides the structural fields entirely for that role rather than
// showing them disabled, since a COUNTRY_ADMIN can also never create a
// country (structural fields are meaningless on a record they didn't make).
export default function CountryForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { admin } = useAuth()
  const contentOnly = admin?.role === 'COUNTRY_ADMIN'
  useDocumentTitle(`${isEdit ? 'Edit' : 'New'} Country | World Wide Missions Admin`)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    countriesApi
      .get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          isoCode: data.isoCode || '',
          continent: data.continent?._id || data.continent || null,
          overview: data.overview || '',
          flagImageUrl: data.flagImageUrl || '',
          isActive: data.isActive,
          order: data.order ?? 0,
          contact: {
            headquartersAddress: data.contact?.headquartersAddress || '',
            mailingAddress: data.contact?.mailingAddress || '',
            phone: data.contact?.phone || '',
            email: data.contact?.email || '',
          },
        })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load this country.')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }
  function updateContact(field, value) {
    setForm((prev) => ({ ...prev, contact: { ...prev.contact, [field]: value } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const contentPayload = {
      overview: form.overview || undefined,
      flagImageUrl: form.flagImageUrl || undefined,
      contact: form.contact,
    }
    const payload = contentOnly
      ? contentPayload
      : {
          name: form.name,
          slug: form.slug || undefined,
          isoCode: form.isoCode || undefined,
          continent: form.continent,
          order: Number(form.order) || 0,
          isActive: form.isActive,
          ...contentPayload,
        }

    try {
      if (isEdit) await countriesApi.update(id, payload)
      else await countriesApi.create(payload)
      navigate('/admin/countries')
    } catch (err) {
      setError(errorMessage(err, 'Could not save this country.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading country…" />

  return (
    <FormShell title={isEdit ? 'Edit Country' : 'New Country'} backTo="/admin/countries" onSubmit={handleSubmit} error={error} saving={saving}>
      {!contentOnly && (
        <>
          <FormField label="Name" htmlFor="name" required>
            <input id="name" required className={inputClasses} value={form.name} onChange={(e) => update('name', e.target.value)} />
          </FormField>
          <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate from the name.">
            <input id="slug" className={inputClasses} value={form.slug} onChange={(e) => update('slug', e.target.value)} />
          </FormField>
          <FormField label="Continent" htmlFor="continent" required>
            <ReferenceSelect id="continent" value={form.continent} onChange={(v) => update('continent', v)} fetchOptions={continentsApi.list} />
          </FormField>
          <FormField label="ISO Code" htmlFor="isoCode">
            <input id="isoCode" className={inputClasses} value={form.isoCode} onChange={(e) => update('isoCode', e.target.value)} />
          </FormField>
          <FormField label="Display order" htmlFor="order">
            <input id="order" type="number" className={inputClasses} value={form.order} onChange={(e) => update('order', e.target.value)} />
          </FormField>
          <label className="flex items-center gap-2 text-sm font-medium text-wwm-neutral-900">
            <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
            Active (visible on the public site)
          </label>
        </>
      )}

      <FormField label="Overview" htmlFor="overview">
        <textarea id="overview" rows={5} className={inputClasses} value={form.overview} onChange={(e) => update('overview', e.target.value)} />
      </FormField>
      <FormField label="Flag image URL" htmlFor="flagImageUrl">
        <input id="flagImageUrl" className={inputClasses} value={form.flagImageUrl} onChange={(e) => update('flagImageUrl', e.target.value)} />
      </FormField>

      <fieldset className="border border-wwm-neutral-300 p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-wwm-navy">Contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Headquarters address" htmlFor="hqAddress">
            <input id="hqAddress" className={inputClasses} value={form.contact.headquartersAddress} onChange={(e) => updateContact('headquartersAddress', e.target.value)} />
          </FormField>
          <FormField label="Mailing address" htmlFor="mailingAddress">
            <input id="mailingAddress" className={inputClasses} value={form.contact.mailingAddress} onChange={(e) => updateContact('mailingAddress', e.target.value)} />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <input id="phone" className={inputClasses} value={form.contact.phone} onChange={(e) => updateContact('phone', e.target.value)} />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <input id="email" type="email" className={inputClasses} value={form.contact.email} onChange={(e) => updateContact('email', e.target.value)} />
          </FormField>
        </div>
      </fieldset>
    </FormShell>
  )
}

import { useEffect, useState } from 'react'
import FormField, { inputClasses } from './FormField.jsx'
import ReferenceSelect from './ReferenceSelect.jsx'
import Alert from './Alert.jsx'
import { peopleApi, errorMessage } from '../../../services/adminApi.js'

const EMPTY = { title: '', person: null, parentEntry: '', order: 0, current: true, startYear: '', endYear: '', notes: '' }

// Add/edit modal for one hierarchy entry (a CountryAdministration "position"
// or AffiliatePastorsBoard "member" — identical shape). `entries` is the
// document's current full list, used to build the "reports to" choices and
// to exclude the entry being edited from its own parent options (the
// server's own cycle guard is the real protection; excluding it here is
// just a usability nicety).
export default function HierarchyEntryModal({ open, entryNoun, entries, editing, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (editing) {
      setForm({
        title: editing.title || '',
        person: editing.person?._id || editing.person || null,
        parentEntry: editing.parentEntry ? String(editing.parentEntry) : '',
        order: editing.order ?? 0,
        current: editing.current ?? true,
        startYear: editing.start?.year ?? '',
        endYear: editing.end?.year ?? '',
        notes: editing.notes || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, editing])

  if (!open) return null

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function looseYear(year) {
    return year === '' || year === null || year === undefined ? undefined : { year: Number(year) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title: form.title,
      person: form.person || undefined,
      parentEntry: form.parentEntry || null,
      order: Number(form.order) || 0,
      current: form.current,
      start: looseYear(form.startYear),
      end: looseYear(form.endYear),
      notes: form.notes || undefined,
    }
    try {
      await onSave(payload)
    } catch (err) {
      setError(errorMessage(err, `Could not save this ${entryNoun}.`))
      setSaving(false)
      return
    }
    setSaving(false)
  }

  const parentChoices = entries.filter((e) => !editing || String(e._id) !== String(editing._id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-wwm-neutral-900/60 px-4" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-lg border border-wwm-neutral-300 bg-wwm-white p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide text-wwm-navy">
          {editing ? `Edit ${entryNoun}` : `Add ${entryNoun}`}
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          <Alert variant="error">{error}</Alert>
          <FormField label="Title" htmlFor="entry-title" required>
            <input id="entry-title" required className={inputClasses} value={form.title} onChange={(e) => update('title', e.target.value)} />
          </FormField>
          <FormField label="Person" htmlFor="entry-person" hint="Optional — a title can be vacant.">
            <ReferenceSelect id="entry-person" value={form.person} onChange={(v) => update('person', v)} fetchOptions={peopleApi.list} getLabel={(p) => p.displayName} placeholder="Vacant" />
          </FormField>
          <FormField label="Reports to" htmlFor="entry-parent" hint="Optional — leave unset for the top of the structure.">
            <select id="entry-parent" className={inputClasses} value={form.parentEntry} onChange={(e) => update('parentEntry', e.target.value)}>
              <option value="">None (top of structure)</option>
              {parentChoices.map((e) => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start (year)" htmlFor="entry-start">
              <input id="entry-start" type="number" className={inputClasses} value={form.startYear} onChange={(e) => update('startYear', e.target.value)} />
            </FormField>
            <FormField label="End (year)" htmlFor="entry-end">
              <input id="entry-end" type="number" className={inputClasses} value={form.endYear} onChange={(e) => update('endYear', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Display order" htmlFor="entry-order">
            <input id="entry-order" type="number" className={inputClasses} value={form.order} onChange={(e) => update('order', e.target.value)} />
          </FormField>
          <FormField label="Notes" htmlFor="entry-notes">
            <textarea id="entry-notes" rows={2} className={inputClasses} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-wwm-neutral-900">
            <input type="checkbox" checked={form.current} onChange={(e) => update('current', e.target.checked)} /> Currently held
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-wwm-neutral-300 pt-4">
          <button type="button" onClick={onClose} disabled={saving} className="border border-wwm-neutral-300 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-neutral-100 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="bg-wwm-gold px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-gold-light disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

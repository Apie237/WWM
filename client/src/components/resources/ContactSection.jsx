import { useState } from 'react'
import FormField, { FormStatus, fieldClasses } from '../ui/FormField.jsx'
import { submitContactMessage, apiErrorMessage } from '../../services/api.js'

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' }

// Contact form. No address/phone/email is shown here: no verified current
// contact details have been supplied (docs/PROJECT_SPEC.md §14 "do not
// invent"), and the historical Pasadena address must never appear as current.
export default function ContactSection() {
  const [form, setForm] = useState(EMPTY)
  const [result, setResult] = useState({ status: 'idle', message: '' })
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setResult({ status: 'sending', message: '' })
    try {
      const { data } = await submitContactMessage({ ...form, subject: form.subject || undefined })
      setForm(EMPTY)
      setResult({ status: 'success', message: data?.message || 'Thank you. Your message has been sent.' })
    } catch (err) {
      setResult({ status: 'error', message: apiErrorMessage(err, 'Your message could not be sent. Please try again.') })
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
      <p className="text-sm leading-relaxed text-wwm-neutral-600">
        Send us a message and we will respond by email. Verified office address, phone and email details will be published here once confirmed.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-wwm-neutral-300 bg-wwm-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="ct-name" required>
            <input id="ct-name" required maxLength={150} autoComplete="name" className={fieldClasses} value={form.name} onChange={(e) => update('name', e.target.value)} />
          </FormField>
          <FormField label="Email" htmlFor="ct-email" required>
            <input id="ct-email" type="email" required maxLength={254} autoComplete="email" className={fieldClasses} value={form.email} onChange={(e) => update('email', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Subject" htmlFor="ct-subject" hint="Optional.">
          <input id="ct-subject" maxLength={200} className={fieldClasses} value={form.subject} onChange={(e) => update('subject', e.target.value)} />
        </FormField>
        <FormField label="Message" htmlFor="ct-message" required>
          <textarea id="ct-message" required rows={6} maxLength={5000} className={fieldClasses} value={form.message} onChange={(e) => update('message', e.target.value)} />
        </FormField>

        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="ct-website">Leave this field empty</label>
          <input id="ct-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} />
        </div>

        <FormStatus status={result.status} message={result.message} />
        <button
          type="submit"
          disabled={result.status === 'sending'}
          className="self-start bg-wwm-gold px-6 py-3 text-sm font-semibold uppercase tracking-wider text-wwm-navy hover:bg-wwm-gold-light disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-wwm-gold focus-visible:outline-offset-2"
        >
          {result.status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { Megaphone } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import LoadingState from '../ui/LoadingState.jsx'
import FormField, { FormStatus, fieldClasses } from '../ui/FormField.jsx'
import PrayerRequestCard from '../content/PrayerRequestCard.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getCountries, getPrayerRequests, submitPrayerRequest, apiErrorMessage } from '../../services/api.js'

const EMPTY = { name: '', request: '', showName: false, country: '', website: '' }

// Submission form (never public until approved) + approved public requests.
export default function PrayerRequestsSection() {
  const [form, setForm] = useState(EMPTY)
  const [result, setResult] = useState({ status: 'idle', message: '' })
  const countries = useFetch(getCountries, { limit: 100 })
  const requests = useFetch(getPrayerRequests, { limit: 10 })

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setResult({ status: 'sending', message: '' })
    try {
      const { data } = await submitPrayerRequest({
        name: form.name || undefined,
        request: form.request,
        showName: form.showName,
        country: form.country || undefined,
        website: form.website,
      })
      setForm(EMPTY)
      setResult({ status: 'success', message: data?.message || 'Thank you. Your request will appear after review.' })
    } catch (err) {
      setResult({ status: 'error', message: apiErrorMessage(err, 'Your request could not be sent. Please try again.') })
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-wwm-neutral-300 bg-wwm-white p-6" noValidate={false}>
        <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Submit a prayer request</h3>
        <p className="text-sm text-wwm-neutral-600">Requests are reviewed before anything is shown publicly.</p>

        <FormField label="Your request" htmlFor="pr-request" required>
          <textarea id="pr-request" required rows={5} maxLength={2000} className={fieldClasses} value={form.request} onChange={(e) => update('request', e.target.value)} />
        </FormField>
        <FormField label="Your name" htmlFor="pr-name" hint="Optional.">
          <input id="pr-name" maxLength={100} className={fieldClasses} value={form.name} onChange={(e) => update('name', e.target.value)} />
        </FormField>
        <FormField label="Country" htmlFor="pr-country" hint="Optional.">
          <select id="pr-country" className={fieldClasses} value={form.country} onChange={(e) => update('country', e.target.value)}>
            <option value="">Not specified</option>
            {countries.data.map((c) => (
              <option key={c._id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </FormField>
        <label className="flex items-start gap-2 text-sm text-wwm-neutral-900">
          <input type="checkbox" className="mt-1" checked={form.showName} disabled={!form.name} onChange={(e) => update('showName', e.target.checked)} />
          <span>Show my name publicly if this request is approved (otherwise it is shown as Anonymous).</span>
        </label>

        {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="pr-website">Leave this field empty</label>
          <input id="pr-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} />
        </div>

        <FormStatus status={result.status} message={result.message} />
        <button
          type="submit"
          disabled={result.status === 'sending'}
          className="self-start bg-wwm-gold px-6 py-3 text-sm font-semibold uppercase tracking-wider text-wwm-navy hover:bg-wwm-gold-light disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-wwm-gold focus-visible:outline-offset-2"
        >
          {result.status === 'sending' ? 'Sending…' : 'Submit request'}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-wwm-navy">Prayer needs</h3>
        <div className="mt-5 space-y-4">
          {requests.status === 'loading' ? (
            <LoadingState label="Loading prayer requests…" />
          ) : requests.status === 'error' ? (
            <EmptyState icon={Megaphone} title="Prayer requests could not be loaded" description="Please try again later." />
          ) : requests.data.length === 0 ? (
            <EmptyState icon={Megaphone} title="No public prayer requests yet" description="Approved requests will be shown here." />
          ) : (
            requests.data.map((item) => <PrayerRequestCard key={item._id} item={item} />)
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { mediaApi, errorMessage } from '../../../services/adminApi.js'
import { inputClasses } from './FormField.jsx'

// Reusable image field for CMS forms (Phase 9). `value` is { url, publicId };
// `onChange` receives the same shape. Uploading goes through the server; this
// component only ever handles the returned public id and URL. When Cloudinary
// is not configured it falls back to the plain "image link" input so local
// development keeps working.
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ImageUpload({ id, kind, value, onChange, disabled = false }) {
  const [config, setConfig] = useState(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [brokenUrl, setBrokenUrl] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    mediaApi.config()
      .then(({ data }) => !cancelled && setConfig(data))
      .catch(() => !cancelled && setConfig({ enabled: false }))
    return () => { cancelled = true }
  }, [])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setNotice(null)
    const maxBytes = config?.maxBytes
    if (!TYPES.includes(file.type)) return setError('Please choose a JPEG, PNG or WebP image.')
    if (maxBytes && file.size > maxBytes) {
      return setError(`This image is too large. The maximum size is ${(maxBytes / 1024 / 1024).toFixed(1).replace(/\.0$/, '')} MB.`)
    }
    setBusy(true)
    setProgress(0)
    try {
      const { data } = await mediaApi.upload(kind, file, setProgress)
      onChange({ url: data.url, publicId: data.publicId })
      setNotice('Image uploaded. Save the form to keep it.')
    } catch (err) {
      setError(errorMessage(err, 'Upload failed. Please try again.'))
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const enabled = config?.enabled === true
  const hasImage = Boolean(value.url)
  const broken = brokenUrl === value.url

  return (
    <div className="flex flex-col gap-3">
      {hasImage && (
        <div className="flex items-start gap-4">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden border border-wwm-neutral-300 bg-wwm-neutral-100">
            {broken ? (
              <span className="px-2 text-center text-xs text-wwm-neutral-600">Preview unavailable</span>
            ) : (
              <img src={value.url} alt="Current image preview" className="h-full w-full object-cover" onError={() => setBrokenUrl(value.url)} />
            )}
          </div>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => { onChange({ url: '', publicId: '' }); setNotice('Image removed. Save the form to apply.'); setError(null) }}
            className="inline-flex items-center gap-1.5 border border-wwm-neutral-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-wwm-neutral-100 focus-visible:outline-2 focus-visible:outline-wwm-gold disabled:opacity-50"
          >
            <Trash2 size={14} aria-hidden="true" /> Remove image
          </button>
        </div>
      )}

      {enabled ? (
        <div>
          <input ref={inputRef} id={id} type="file" accept={TYPES.join(',')} className="sr-only" onChange={handleFile} disabled={disabled || busy} />
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 border border-wwm-navy px-3 py-2 text-sm font-semibold text-wwm-navy hover:bg-wwm-neutral-100 focus-visible:outline-2 focus-visible:outline-wwm-gold disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
            {busy ? `Uploading${progress != null ? ` ${progress}%` : '…'}` : hasImage ? 'Replace image' : 'Upload image'}
          </button>
          <p className="mt-1.5 text-xs text-wwm-neutral-600">
            JPEG, PNG or WebP, up to {(config.maxBytes / 1024 / 1024).toFixed(1).replace(/\.0$/, '')} MB.
          </p>
        </div>
      ) : config ? (
        <div className="flex flex-col gap-1.5">
          <input id={id} type="url" className={inputClasses} value={value.publicId ? '' : value.url} disabled={disabled || Boolean(value.publicId)} placeholder="https://…" onChange={(e) => onChange({ url: e.target.value, publicId: '' })} />
          <p className="text-xs text-wwm-neutral-600">Image uploads are not configured on this server, so an http(s) image link can be used instead.</p>
        </div>
      ) : null}

      <div aria-live="polite">
        {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
        {notice && !error && <p className="text-xs font-semibold text-green-800">{notice}</p>}
      </div>
    </div>
  )
}

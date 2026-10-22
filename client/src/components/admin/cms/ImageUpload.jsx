import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, RefreshCw } from 'lucide-react'
import { mediaApi, errorMessage } from '../../../services/adminApi.js'
import { inputClasses } from './FormField.jsx'
import { IMAGE_TYPES, formatMb, uploadAvailability, validateImageFile } from '../../../lib/imageUpload.js'

// Reusable image field for CMS forms. `value` is { url, publicId }; `onChange`
// receives the same shape. Uploading goes through our API (the browser never
// sees Cloudinary credentials); this component only handles the returned
// public id and URL.
//
// The upload control is ALWAYS visible. When it cannot be used the field says
// why (not configured / could not check / read-only role) instead of silently
// showing something else, and offers the plain "image link" input as a clearly
// labelled alternative where that is allowed.
const btn =
  'inline-flex min-h-[44px] items-center gap-2 border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-wwm-gold disabled:cursor-not-allowed disabled:opacity-50'

export default function ImageUpload({ id, kind, value, onChange, disabled = false }) {
  const [config, setConfig] = useState(null)
  const [configFailed, setConfigFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [brokenUrl, setBrokenUrl] = useState(null)
  const inputRef = useRef(null)

  const loadConfig = useCallback(() => {
    let cancelled = false
    mediaApi.config()
      .then(({ data }) => !cancelled && setConfig(data))
      .catch(() => !cancelled && setConfigFailed(true))
    return () => { cancelled = true }
  }, [])
  useEffect(() => loadConfig(), [loadConfig])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setNotice(null)
    const problem = validateImageFile(file, config?.maxBytes)
    if (problem) return setError(problem)
    setBusy(true)
    setProgress(0)
    try {
      const { data } = await mediaApi.upload(kind, file, setProgress)
      onChange({ url: data.url, publicId: data.publicId })
      setBrokenUrl(null)
      setNotice('Image uploaded. Save the form to keep it.')
    } catch (err) {
      setError(errorMessage(err, 'Upload failed. Please check your connection and try again.'))
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const unavailable = uploadAvailability({ config, configFailed, readOnly: disabled })
  const hasImage = Boolean(value.url)
  const broken = brokenUrl === value.url
  const statusId = `${id}-status`
  const canLink = unavailable === 'disabled' || unavailable === 'unreachable'

  return (
    <div className="flex flex-col gap-3">
      {hasImage ? (
        <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start">
          <div className="flex aspect-[4/3] w-full max-w-[220px] shrink-0 items-center justify-center overflow-hidden border border-wwm-neutral-300 bg-wwm-neutral-100">
            {broken ? (
              <span className="px-2 text-center text-xs text-wwm-neutral-600">Preview unavailable (the image link could not be loaded)</span>
            ) : (
              <img src={value.url} alt="Current photograph preview" className="h-full w-full object-cover" onError={() => setBrokenUrl(value.url)} />
            )}
          </div>
          <p className="text-xs text-wwm-neutral-600">
            {value.publicId ? 'Uploaded image.' : 'Image from a link.'} This is the photograph visitors will see once the entry is saved and published.
          </p>
        </div>
      ) : (
        <p className="text-sm text-wwm-neutral-600">No photograph yet.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          onChange={handleFile}
          disabled={Boolean(unavailable) || busy}
          aria-describedby={statusId}
        />
        <button
          type="button"
          disabled={Boolean(unavailable) || busy}
          aria-describedby={statusId}
          onClick={() => inputRef.current?.click()}
          className={`${btn} border-wwm-navy text-wwm-navy hover:bg-wwm-neutral-100`}
        >
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
          {busy ? `Uploading${progress != null ? ` ${progress}%` : '…'}` : hasImage ? 'Replace photograph' : 'Upload photograph'}
        </button>
        {hasImage && (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => { onChange({ url: '', publicId: '' }); setNotice('Photograph removed. Save the form to apply.'); setError(null) }}
            className={`${btn} border-wwm-neutral-300 text-red-700 hover:bg-wwm-neutral-100`}
          >
            <Trash2 size={16} aria-hidden="true" /> Remove photograph
          </button>
        )}
      </div>

      <div id={statusId} className="text-xs text-wwm-neutral-600">
        {unavailable === null && <p>JPEG, PNG or WebP, up to {formatMb(config.maxBytes)}.</p>}
        {unavailable === 'loading' && <p>Checking whether image upload is available…</p>}
        {unavailable === 'readonly' && <p>Your role can view this photograph but not change it.</p>}
        {unavailable === 'disabled' && (
          <p>
            Image upload is not set up on this server yet, so the upload button is turned off. An administrator needs to add the image-service
            settings (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET) to the server environment. Meanwhile you can use an image link below.
          </p>
        )}
        {unavailable === 'unreachable' && (
          <p className="flex flex-wrap items-center gap-2">
            <span>Could not check whether image upload is available (your session may have expired, or the server is unreachable).</span>
            <button type="button" onClick={() => { setConfigFailed(false); loadConfig() }} className="inline-flex items-center gap-1 border border-wwm-neutral-300 px-2 py-1 font-semibold text-wwm-navy hover:bg-wwm-neutral-100 focus-visible:outline-2 focus-visible:outline-wwm-gold">
              <RefreshCw size={12} aria-hidden="true" /> Try again
            </button>
          </p>
        )}
      </div>

      {canLink && !disabled && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-link`} className="text-sm font-medium text-wwm-neutral-900">Or use an image link</label>
          <input
            id={`${id}-link`}
            type="url"
            className={inputClasses}
            value={value.publicId ? '' : value.url}
            disabled={Boolean(value.publicId)}
            placeholder="https://…"
            onChange={(e) => onChange({ url: e.target.value, publicId: '' })}
          />
          {value.publicId && <p className="text-xs text-wwm-neutral-600">Remove the uploaded photograph first to use a link instead.</p>}
        </div>
      )}

      <div aria-live="polite">
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
        {notice && !error && <p className="text-sm font-semibold text-green-800">{notice}</p>}
      </div>
    </div>
  )
}

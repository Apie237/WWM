// Pure helpers behind the CMS image field (components/admin/cms/ImageUpload.jsx),
// kept free of React so they can be unit-tested.
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function formatMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, '')} MB`
}

// Why the upload control cannot be used right now, or null when it can.
//   loading     – availability not known yet
//   unreachable – the config request failed (network, expired session, server error)
//   disabled    – the server answered, but Cloudinary is not configured
//   readonly    – the signed-in role may not change this record
export function uploadAvailability({ config, configFailed, readOnly }) {
  if (readOnly) return 'readonly'
  if (configFailed) return 'unreachable'
  if (!config) return 'loading'
  return config.enabled === true ? null : 'disabled'
}

// Returns an error message, or null when the file may be uploaded.
export function validateImageFile(file, maxBytes) {
  if (!IMAGE_TYPES.includes(file?.type)) return 'Please choose a JPEG, PNG or WebP image.'
  if (maxBytes && file.size > maxBytes) {
    return `This image is too large. The maximum size is ${formatMb(maxBytes)}.`
  }
  return null
}

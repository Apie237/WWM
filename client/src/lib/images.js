// Public-site helper: ask Cloudinary for a width-limited rendition of images
// uploaded through the CMS. Any other URL (legacy links, relative paths) is
// returned untouched, so nothing breaks for pre-Phase-9 data.
const MANAGED = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/f_auto,q_auto)\/(wwm\/.+)$/

export function imageSrc(url, width) {
  if (!url || !width) return url
  const m = MANAGED.exec(url)
  return m ? `${m[1]},w_${width},c_limit/${m[2]}` : url
}

export function imageSrcSet(url, widths) {
  if (!url || !MANAGED.test(url)) return undefined
  return widths.map((w) => `${imageSrc(url, w)} ${w}w`).join(', ')
}

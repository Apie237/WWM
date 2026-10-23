// Client-side checks for the History photograph workflow. Components are
// loaded through Vite's own SSR transform (the project's real JSX toolchain)
// and rendered to static HTML; no browser and no network are involved.
//   - public History cards/portraits/features render uploaded images with
//     their alt text and caption, and degrade to the right fallback;
//   - the CMS image field explains every state instead of hiding the control.
// Not covered here (needs a browser): clicking, file selection, onError after load.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { uploadAvailability, validateImageFile, formatMb } from '../lib/imageUpload.js'

let vite
let mod
before(async () => {
  vite = await createServer({ configFile: false, plugins: [react()], appType: 'custom', server: { middlewareMode: true }, logLevel: 'silent', optimizeDeps: { noDiscovery: true } })
  mod = {
    Feature: (await vite.ssrLoadModule('/src/components/history/HistoryFeature.jsx')).default,
    Timeline: (await vite.ssrLoadModule('/src/components/history/LeadershipTimeline.jsx')).default,
    Records: (await vite.ssrLoadModule('/src/components/history/HistoricalRecords.jsx')).default,
    HistoryImage: { default: (await vite.ssrLoadModule('/src/components/history/HistoryImage.jsx')).default, ...(await vite.ssrLoadModule('/src/lib/historyImage.js')) },
    Photo: (await vite.ssrLoadModule('/src/components/history/EntryPhoto.jsx')).default,
    Upload: (await vite.ssrLoadModule('/src/components/admin/cms/ImageUpload.jsx')).default,
    history: await vite.ssrLoadModule('/src/lib/history.js'),
    images: await vite.ssrLoadModule('/src/lib/images.js'),
  }
})
after(() => vite.close())

const URL1 = 'https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto/wwm/history/' + 'a'.repeat(32)
const entry = (extra = {}) => ({ _id: '1', title: 'Entry title', description: 'Body text.', section: 'origins', people: [], ...extra })
const html = (el) => renderToStaticMarkup(el)

test('origins / international-leadership feature shows the uploaded image with alt text and caption', () => {
  const out = html(h(mod.Feature, { entry: entry({ imageUrl: URL1, imageAlt: 'A young couple', imageCaption: 'Early years' }) }))
  assert.match(out, /<img /)
  assert.ok(out.includes('alt="A young couple"'))
  assert.ok(out.includes('Early years'))
  assert.ok(out.includes('w_960,c_limit/wwm/history/'), 'uses a width-limited Cloudinary rendition')
  assert.match(out, /srcSet="[^"]*w_640/)
})

test('feature with no image but photo metadata shows the labelled placeholder; with nothing it is text only', () => {
  const placeholder = html(h(mod.Feature, { entry: entry({ imageAlt: 'x', imageCaption: 'Smalldridge family' }) }))
  assert.ok(!placeholder.includes('<img '))
  assert.ok(placeholder.includes('Photograph of Smalldridge family coming soon'))
  const textOnly = html(h(mod.Feature, { entry: entry() }))
  assert.ok(!textOnly.includes('<img ') && !textOnly.includes('coming soon'))
})

test('a legacy (non-Cloudinary) link is used as-is, without a srcset', () => {
  const out = html(h(mod.Feature, { entry: entry({ imageUrl: 'https://example.org/photo.jpg', imageAlt: 'Old' }) }))
  assert.ok(out.includes('src="https://example.org/photo.jpg"'))
  assert.ok(!out.includes('srcSet'))
})

test('Cameroon leadership portrait uses the entry photograph, else a single linked person’s photo, else an icon', () => {
  const own = html(h(mod.Timeline, { entries: [entry({ imageUrl: URL1, imageAlt: 'Pastor portrait' })] }))
  assert.ok(own.includes('alt="Pastor portrait"') && own.includes('w_480,c_limit'))
  const person = html(h(mod.Timeline, { entries: [entry({ people: [{ displayName: 'Pastor A', photoUrl: 'https://example.org/a.jpg' }] })] }))
  assert.ok(person.includes('src="https://example.org/a.jpg"') && person.includes('alt="Pastor A"'))
  const two = html(h(mod.Timeline, { entries: [entry({ people: [{ displayName: 'A', photoUrl: 'https://example.org/a.jpg' }, { displayName: 'B', photoUrl: 'https://example.org/b.jpg' }] })] }))
  assert.ok(!two.includes('<img '), 'a couple never borrows one person’s portrait')
  assert.match(two, /role="img"/)
})

test('compact cards (secondary Cameroon, international growth) show an uploaded photo and nothing when there is none', () => {
  const withImg = html(h(mod.Photo, { entry: entry({ imageUrl: URL1, imageAlt: 'Church opening', imageCaption: 'Opening day' }) }))
  assert.ok(withImg.includes('alt="Church opening"') && withImg.includes('Opening day'))
  assert.equal(html(h(mod.Photo, { entry: entry() })), '')
})

test('entryImage falls back to the title for alt text when none was written', () => {
  assert.equal(mod.history.entryImage(entry({ imageUrl: URL1 })).alt, 'Entry title')
})

test('image URL helpers only rewrite managed Cloudinary URLs', () => {
  assert.equal(mod.images.imageSrc('https://example.org/x.jpg', 300), 'https://example.org/x.jpg')
  assert.equal(mod.images.imageSrc(undefined, 300), undefined)
})

// ---- CMS field -------------------------------------------------------------
test('uploadAvailability distinguishes every reason the control cannot be used', () => {
  assert.equal(uploadAvailability({ config: null, configFailed: false, readOnly: false }), 'loading')
  assert.equal(uploadAvailability({ config: null, configFailed: true, readOnly: false }), 'unreachable')
  assert.equal(uploadAvailability({ config: { enabled: false }, configFailed: false, readOnly: false }), 'disabled')
  assert.equal(uploadAvailability({ config: { enabled: true }, configFailed: false, readOnly: true }), 'readonly')
  assert.equal(uploadAvailability({ config: { enabled: true, maxBytes: 1 }, configFailed: false, readOnly: false }), null)
})

test('validateImageFile accepts JPEG/PNG/WebP within the limit and rejects others with a clear message', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) assert.equal(validateImageFile({ type, size: 10 }, 100), null)
  assert.match(validateImageFile({ type: 'image/gif', size: 10 }, 100), /JPEG, PNG or WebP/)
  assert.match(validateImageFile({ type: 'application/pdf', size: 10 }, 100), /JPEG, PNG or WebP/)
  assert.match(validateImageFile({ type: 'image/png', size: 5 * 1024 * 1024 }, 4 * 1024 * 1024), /maximum size is 4 MB/)
  assert.equal(formatMb(4 * 1024 * 1024), '4 MB')
})

test('the upload field always renders a labelled upload button, with a status line', () => {
  const out = html(h(mod.Upload, { id: 'imageUrl', kind: 'history', value: { url: '', publicId: '' }, onChange() {} }))
  assert.ok(out.includes('Upload photograph'))
  assert.ok(out.includes('No photograph yet.'))
  assert.ok(out.includes('Checking whether image upload is available'))
})

test('with an existing image it offers Replace and Remove and shows the preview', () => {
  const out = html(h(mod.Upload, { id: 'imageUrl', kind: 'history', value: { url: URL1, publicId: 'wwm/history/' + 'a'.repeat(32) }, onChange() {} }))
  assert.ok(out.includes('Replace photograph') && out.includes('Remove photograph'))
  assert.ok(out.includes(`src="${URL1}"`) && out.includes('Current photograph preview'))
})

test('read-only role: controls are disabled and the reason is stated', () => {
  const out = html(h(mod.Upload, { id: 'imageUrl', kind: 'history', value: { url: URL1, publicId: '' }, onChange() {}, disabled: true }))
  assert.ok(out.includes('Your role can view this photograph but not change it.'))
  assert.match(out, /<button[^>]*disabled=""[^>]*>[^<]*(<svg.*?<\/svg>)?\s*Replace photograph/s)
})

// ---- layout / sizing -------------------------------------------------------
const imgTag = (out) => /<img [^>]*>/.exec(out)?.[0] ?? ''

test('every History image variant shows the whole photograph: object-contain, auto height, never object-cover', () => {
  for (const variant of Object.keys(mod.HistoryImage.HISTORY_IMAGE_VARIANTS)) {
    const tag = imgTag(html(h(mod.HistoryImage.default, { image: { url: URL1, alt: 'x' }, variant })))
    assert.match(tag, /object-contain/, variant)
    assert.match(tag, /\bh-auto\b/, variant)
    assert.match(tag, /\bw-full\b/, variant)
    assert.ok(!/object-cover|\bh-full\b/.test(tag), `${variant} must not crop or force a height`)
    assert.match(tag, /max-h-/, `${variant} has a height ceiling`)
  }
})

test('the framed mat gives spare room a neutral background and padding', () => {
  const out = html(h(mod.HistoryImage.default, { image: { url: URL1, alt: 'x' }, variant: 'feature' }))
  assert.match(out, /bg-wwm-neutral-100 p-1\.5/)
})

test('portraits align to the top; the timeline photo column is much larger than the old 6–8rem square', () => {
  const out = html(h(mod.Timeline, { entries: [entry({ imageUrl: URL1, imageAlt: 'Pastor portrait' })] }))
  assert.match(imgTag(out), /object-top/)
  assert.match(out, /min-\[420px\]:w-40/) // 10rem at phone-landscape
  assert.match(out, /sm:w-48/) // 12rem
  assert.match(out, /lg:w-56/) // 14rem
  assert.ok(!/h-24 w-24|sm:h-32 sm:w-32/.test(imgTag(out)))
})

test('timeline rows without a photo keep the small icon but share the same column width', () => {
  const out = html(h(mod.Timeline, { entries: [entry()] }))
  assert.ok(!out.includes('<img '))
  assert.match(out, /min-\[420px\]:w-40 sm:w-48 lg:w-56/)
  assert.match(out, /Photograph of Entry title coming soon/)
})

test('features give the photograph the wider column, mirrored when the layout is reversed', () => {
  const e = entry({ imageUrl: URL1, imageAlt: 'x' })
  assert.match(html(h(mod.Feature, { entry: e })), /lg:grid-cols-\[1\.2fr_1fr\]/)
  assert.match(html(h(mod.Feature, { entry: e, reverse: true })), /lg:grid-cols-\[1fr_1\.2fr\]/)
  assert.match(html(h(mod.Feature, { entry: e, large: true })), /lg:grid-cols-\[1\.35fr_1fr\]/)
  assert.ok(!/lg:grid-cols/.test(html(h(mod.Feature, { entry: entry() }))), 'text-only entries stay single column')
})

test('records show only a photograph uploaded for that record (never a linked person’s portrait)', () => {
  const withOwn = html(h(mod.Records, { entries: [entry({ section: 'records', imageUrl: URL1, imageAlt: 'Scanned letter', imageCaption: 'Letter, page 1' })] }))
  assert.ok(withOwn.includes('alt="Scanned letter"') && withOwn.includes('Letter, page 1') && /max-h-\[28rem\]/.test(withOwn))
  const borrowed = html(h(mod.Records, { entries: [entry({ section: 'records', people: [{ displayName: 'A', photoUrl: 'https://example.org/a.jpg' }] })] }))
  assert.ok(!borrowed.includes('<img '))
  const none = html(h(mod.Records, { entries: [entry({ section: 'records' })] }))
  assert.ok(!none.includes('<img ') && !none.includes('<figure'))
})

test('no image → the fallback is rendered, and no empty frame is left behind', () => {
  const out = html(h(mod.HistoryImage.default, { image: null, variant: 'card', fallback: h('p', null, 'fallback') }))
  assert.equal(out, '<p>fallback</p>')
  assert.equal(html(h(mod.HistoryImage.default, { image: null })), '')
})

// ---- no public "Source:" labels ---------------------------------------------
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('no History component renders the internal source field, even when an entry has one', async () => {
  const src = { source: 'Founder-supplied records' }
  const full = (extra) => entry({ imageUrl: URL1, imageAlt: 'Alt text', imageCaption: 'Caption text', subtitle: 'Sub', dateLabel: '1960s', location: 'Cameroon', ...src, ...extra })
  const History = (await vite.ssrLoadModule('/src/pages/History.jsx')).default
  const outputs = {
    feature: html(h(mod.Feature, { entry: full() })),
    timeline: html(h(mod.Timeline, { entries: [full(), full({ _id: '2', imageUrl: undefined })] })),
    records: html(h(mod.Records, { entries: [full({ section: 'records' })] })),
  }
  for (const [name, out] of Object.entries(outputs)) {
    assert.ok(!/Source:/i.test(out), `${name} shows a Source label`)
    assert.ok(!out.includes('Founder-supplied'), `${name} shows the source text`)
    // …while the rest of the entry is intact
    assert.ok(out.includes('Entry title') && out.includes('Body text.'), `${name} lost the narrative`)
  }
  assert.ok(outputs.feature.includes('alt="Alt text"') && outputs.feature.includes('Caption text') && outputs.feature.includes('Sub') && outputs.feature.includes('1960s'))
  assert.ok(outputs.timeline.includes('alt="Alt text"'))
  assert.ok(typeof History === 'function')
})

test('the History feature source code has no "Source:" label and never reads entry.source', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const files = [
    'pages/History.jsx',
    ...fs.readdirSync(path.join(root, 'components/history')).filter((f) => f.endsWith('.jsx')).map((f) => `components/history/${f}`),
    'components/home/HeritageBand.jsx',
  ]
  for (const f of files) {
    const code = fs.readFileSync(path.join(root, f), 'utf8')
    assert.ok(!/Source:/.test(code), `${f} contains a "Source:" label`)
    assert.ok(!/\b(e|entry|item)\.source\b/.test(code), `${f} reads the source field`)
  }
})

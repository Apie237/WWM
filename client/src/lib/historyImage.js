// Frame, height ceiling and responsive widths for each History photograph
// variant (see components/history/HistoryImage.jsx).
// All class names are written out in full so Tailwind can see them.
export const HISTORY_IMAGE_VARIANTS = {
  // Large photograph beside a text block (origins, leadership, homepage heritage).
  feature: {
    frame: 'w-full',
    img: 'max-h-[26rem] sm:max-h-[32rem] lg:max-h-[36rem]',
    widths: [640, 960, 1280],
    src: 960,
    sizes: '(min-width: 1024px) 640px, 100vw',
  },
  // Photograph at the top of a compact card.
  card: {
    frame: 'w-full',
    img: 'max-h-[22rem] sm:max-h-[26rem]',
    widths: [480, 720, 1080],
    src: 720,
    sizes: '(min-width: 768px) 560px, 100vw',
  },
  // Scanned records / documents: shown as large as the card allows.
  record: {
    frame: 'w-full',
    img: 'max-h-[28rem] sm:max-h-[34rem]',
    widths: [480, 720, 1080],
    src: 720,
    sizes: '(min-width: 768px) 560px, 100vw',
  },
  // Leadership timeline portrait. Aligns to the top so a tall photo keeps heads in view.
  portrait: {
    frame: 'w-full max-w-[18rem] min-[420px]:w-40 min-[420px]:max-w-none sm:w-48 lg:w-56',
    img: 'max-h-72 sm:max-h-80 object-top',
    widths: [320, 480, 640],
    src: 480,
    sizes: '(min-width: 1024px) 224px, (min-width: 640px) 192px, (min-width: 420px) 160px, 288px',
  },
}


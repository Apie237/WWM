import { ImageOff } from 'lucide-react'

// Clean, explicitly-labeled image placeholder for content that has no real
// photograph yet. Never stands in for fabricated organizational photography
// (docs/PROJECT_SPEC.md Phase 4 instructions, "Images/Media") — structured so
// a future Cloudinary-backed <img> can drop in cleanly (Phase 9).
export default function ImagePlaceholder({ label = 'Image coming soon', className = '', ratio = 'aspect-[4/3]' }) {
  return (
    <div
      className={`flex ${ratio} w-full flex-col items-center justify-center gap-2 border border-wwm-neutral-300 bg-wwm-neutral-100 text-wwm-neutral-600 ${className}`}
      role="img"
      aria-label={label}
    >
      <ImageOff className="h-8 w-8" aria-hidden="true" />
      <span className="px-4 text-center text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
  )
}

export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center px-6 py-10 text-sm text-wwm-neutral-600" role="status">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-wwm-neutral-300 border-t-wwm-navy" />
      <span className="ml-3">{label}</span>
    </div>
  )
}

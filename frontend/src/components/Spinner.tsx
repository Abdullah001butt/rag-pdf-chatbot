export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-text-muted">
      <Spinner />
      {label}
    </div>
  )
}

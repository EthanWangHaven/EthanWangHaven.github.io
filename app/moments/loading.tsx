export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-light)] border-t-[var(--accent)]" />
    </div>
  )
}

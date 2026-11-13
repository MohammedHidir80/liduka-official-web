export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-3 shadow-card">
      <div className="mb-3 aspect-[4/3] rounded-xl bg-ink-100" />
      <div className="mb-2 h-3 w-1/3 rounded bg-ink-100" />
      <div className="mb-2 h-4 w-full rounded bg-ink-100" />
      <div className="mb-2 h-4 w-4/5 rounded bg-ink-100" />
      <div className="h-5 w-1/2 rounded bg-ink-100" />
    </div>
  );
}

export function SkeletonOrderCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-ink-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 w-1/4 rounded bg-ink-100" />
        <div className="h-5 w-16 rounded-full bg-ink-100" />
      </div>
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 rounded-xl bg-ink-100" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-3/4 rounded bg-ink-100" />
          <div className="h-3 w-1/2 rounded bg-ink-100" />
          <div className="h-4 w-1/4 rounded bg-ink-100" />
        </div>
      </div>
    </div>
  );
}
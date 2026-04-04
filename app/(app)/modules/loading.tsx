function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />
}

export default function ProgressLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Category selector */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-lg" />
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Skeleton className="h-6 w-56 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

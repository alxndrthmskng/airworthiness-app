function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />
}

export default function LogbookLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Chart skeleton */}
      <Skeleton className="h-[320px] w-full rounded-xl mb-6" />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>

      {/* Recency skeleton */}
      <div className="rounded-xl border p-5 mb-6">
        <Skeleton className="h-3 w-40 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Form skeleton */}
      <Skeleton className="h-6 w-32 mb-3" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  )
}

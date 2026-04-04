function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />
}

export default function ExportLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="border rounded-lg px-3 py-2">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Filter skeletons */}
      <div className="space-y-4 mb-6">
        <div>
          <Skeleton className="h-3 w-28 mb-2" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-36 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <Skeleton className="h-6 w-48 mb-3" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  )
}

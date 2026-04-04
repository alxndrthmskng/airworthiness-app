function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />
}

export default function ProfileLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border p-6">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-9 w-16 mb-2" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="rounded-xl border p-6">
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-9 w-12" />
        </div>
      </div>

      {/* Recency */}
      <Skeleton className="h-[100px] w-full rounded-xl mb-4" />

      {/* Training cards */}
      <div className="rounded-xl border p-6 mb-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* AML card */}
      <Skeleton className="h-[200px] w-full rounded-xl mb-4" />
    </div>
  )
}

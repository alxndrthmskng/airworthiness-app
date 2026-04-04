'use client'

import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mt-2">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-8">
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  )
}

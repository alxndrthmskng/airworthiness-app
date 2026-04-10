'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function RemoveAssessmentButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleRemove() {
    const confirmed = window.confirm(
      'Are you sure you want to remove your competency assessment result?'
    )
    if (!confirmed) return

    await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competency_completed_at: null }),
    })

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 transition-colors"
    >
      {isPending ? 'Removing...' : 'Remove'}
    </button>
  )
}

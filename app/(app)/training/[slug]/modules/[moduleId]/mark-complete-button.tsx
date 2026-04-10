'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  moduleId: string
  courseSlug: string
  isCompleted: boolean
  nextModuleId?: string
}

export function MarkCompleteButton({ moduleId, courseSlug, isCompleted, nextModuleId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(isCompleted)

  async function handleComplete() {
    if (done) return
    setLoading(true)

    const res = await fetch('/api/training/module-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleId }),
    })

    if (!res.ok) {
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)

    if (nextModuleId) {
      router.push(`/training/${courseSlug}/modules/${nextModuleId}`)
    } else {
      router.push(`/training/${courseSlug}`)
    }

    router.refresh()
  }

  return (
    <Button
      className="w-full"
      onClick={handleComplete}
      disabled={loading || done}
    >
      {done ? '✓ Completed' : loading ? 'Saving...' : 'Mark as complete'}
    </Button>
  )
}

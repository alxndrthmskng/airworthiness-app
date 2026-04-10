'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  entryId: string
  targetStatus?: string
  label?: string
}

export function SubmitForVerification({
  entryId,
  targetStatus = 'pending_verification',
  label = 'Submit for Verification',
}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)

    await fetch(`/api/logbook/${entryId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus }),
    })

    router.refresh()
    setSubmitting(false)
  }

  return (
    <Button onClick={handleSubmit} disabled={submitting} className="w-full">
      {submitting ? 'Submitting...' : label}
    </Button>
  )
}

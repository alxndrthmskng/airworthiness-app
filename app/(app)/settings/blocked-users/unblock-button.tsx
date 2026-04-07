'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  handle: string
}

export function UnblockButton({ handle }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function unblock() {
    startTransition(async () => {
      const res = await fetch('/api/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetHandle: handle }),
      })
      if (res.ok) router.refresh()
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={unblock} disabled={pending}>
      {pending ? 'Unblocking...' : 'Unblock'}
    </Button>
  )
}

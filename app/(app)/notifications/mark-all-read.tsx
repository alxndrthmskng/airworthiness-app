'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Marks all notifications as read on mount. Rendered as a no-op
 * component on the notifications page so that visiting the page
 * automatically clears the unread state.
 */
export function MarkAllRead() {
  const router = useRouter()
  useEffect(() => {
    fetch('/api/notifications', { method: 'POST' })
      .then(() => router.refresh())
      .catch(() => {})
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

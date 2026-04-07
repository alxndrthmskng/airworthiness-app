'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface Props {
  version: string
}

/**
 * Shown when the authenticated user has not yet acknowledged the current
 * version of the privacy policy. Server-side check decides whether to
 * render this component at all (in (app)/layout.tsx) — the banner itself
 * is purely a UI component.
 *
 * Acknowledgement is implicit: dismissing the banner = acknowledged. We
 * record it via the API route so we have a defensible audit entry.
 */
export function PrivacyPolicyBanner({ version }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)

  if (dismissed) return null

  async function dismiss() {
    setBusy(true)
    // Optimistic — UX continues even if the network call fails
    setDismissed(true)
    fetch('/api/consent/privacy-policy', { method: 'POST' }).catch(() => {})
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t shadow-lg">
      <div className="max-w-4xl mx-auto p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Privacy policy updated</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            We've updated our privacy policy. Please review the changes —{' '}
            <Link href="/privacy" className="underline hover:no-underline" target="_blank">
              read the updated policy
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/privacy" target="_blank">
            <Button variant="outline" size="sm">Read</Button>
          </Link>
          <Button size="sm" onClick={dismiss} disabled={busy}>
            Acknowledge
          </Button>
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground p-1 sm:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

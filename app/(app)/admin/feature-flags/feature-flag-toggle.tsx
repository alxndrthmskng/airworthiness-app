'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  flagKey: string
  initialEnabled: boolean
  description: string
}

export function FeatureFlagToggle({ flagKey, initialEnabled, description }: Props) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    const next = !enabled
    const confirmMsg = next
      ? `Enable "${flagKey}"? This will turn the feature on for all users within 60 seconds.`
      : `Disable "${flagKey}"? This will turn the feature off for all users within 60 seconds.`
    if (!window.confirm(confirmMsg)) return

    setError(null)
    setEnabled(next) // optimistic
    startTransition(async () => {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flagKey, enabled: next }),
      })
      if (!res.ok) {
        setEnabled(!next) // revert
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Failed to update flag')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-border p-5 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{flagKey}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            enabled
              ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
              : 'bg-muted text-muted-foreground'
          }`}>
            {enabled ? 'enabled' : 'disabled'}
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 mt-1.5">{error}</p>
        )}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={enabled}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          enabled ? 'bg-foreground' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-background transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

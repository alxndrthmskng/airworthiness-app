'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const HANDLE_REGEX = /^[a-z0-9-]{3,30}$/

interface Props {
  currentHandle: string
}

export function HandleForm({ currentHandle }: Props) {
  const router = useRouter()
  const [handle, setHandle] = useState(currentHandle)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function validate(value: string): string | null {
    if (!value) return 'Handle is required'
    if (!HANDLE_REGEX.test(value)) {
      return 'Handle must be 3-30 characters: lowercase letters, numbers, and hyphens only'
    }
    return null
  }

  async function save() {
    const v = handle.trim().toLowerCase()
    const validationError = validate(v)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setSuccess(false)
    setBusy(true)
    const res = await fetch('/api/profile/public/handle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: v }),
    })
    setBusy(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to save handle')
      return
    }
    setSuccess(true)
    setHandle(v)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border p-5 space-y-4">
      <p className="text-sm text-muted-foreground">
        Your handle is the URL of your public profile. Choose something professional — your CV may link to it.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="handle" className="text-sm text-muted-foreground">Handle</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground whitespace-nowrap">airworthiness.org.uk/u/</span>
          <Input
            id="handle"
            value={handle}
            onChange={e => { setHandle(e.target.value.toLowerCase()); setError(null); setSuccess(false) }}
            placeholder="alex-king"
            className="h-10 rounded-xl flex-1"
            maxLength={30}
            autoFocus
          />
        </div>
        <p className="text-xs text-muted-foreground">3-30 characters. Lowercase letters, numbers, and hyphens only.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Saved.</p>}

      <div className="flex gap-2">
        <Button onClick={save} disabled={busy || (handle === currentHandle && !error)} size="sm">
          {busy ? 'Saving...' : 'Save handle'}
        </Button>
        <Link href={`/u/${handle}`} target="_blank">
          <Button variant="outline" size="sm" disabled={!!error}>
            View profile
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="outline" size="sm">Back to settings</Button>
        </Link>
      </div>
    </div>
  )
}

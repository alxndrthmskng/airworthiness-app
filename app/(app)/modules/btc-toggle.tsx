'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BtcToggleProps {
  initialValue: boolean
  selectedCategory: string
  userId: string
  darkMode?: boolean
}

export function BtcToggle({ initialValue, selectedCategory, userId, darkMode }: BtcToggleProps) {
  const router = useRouter()
  const [checked, setChecked] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  async function handleToggle(value: boolean) {
    setChecked(value)
    setSaving(true)

    await fetch('/api/progress/btc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_category: selectedCategory,
        is_btc: value,
      }),
    })

    setSaving(false)
    router.refresh()
  }

  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => handleToggle(e.target.checked)}
        disabled={saving}
        className="h-5 w-5 rounded border-border mt-0.5 shrink-0"
      />
      <div>
        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-foreground'}`}>
          Basic Training Course
        </span>
        <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-muted-foreground'}`}>
          I have completed a Part 147 Basic Training Course to reduce the practical experience required in my logbook.
        </p>
      </div>
    </label>
  )
}

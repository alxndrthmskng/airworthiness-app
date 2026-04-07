'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Ban } from 'lucide-react'
import { FollowButton } from './follow-button'

interface Props {
  targetPublicId: string
  initialFollowState: 'none' | 'pending' | 'active'
}

/**
 * Combined profile actions: follow button + overflow menu with block.
 */
export function ProfileActions({ targetPublicId, initialFollowState }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  function blockUser() {
    if (!window.confirm(`Block this user? You won't see each other's profiles or posts. Existing follows in either direction will be removed.`)) {
      return
    }
    setMenuOpen(false)
    startTransition(async () => {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPublicId }),
      })
      if (res.ok) {
        router.push('/feed')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <FollowButton targetPublicId={targetPublicId} initialState={initialFollowState} />
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className="w-9 h-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="More actions"
          disabled={pending}
        >
          <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-10">
            <button
              type="button"
              onClick={blockUser}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted text-left"
            >
              <Ban className="w-4 h-4" strokeWidth={1.5} />
              Block user
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

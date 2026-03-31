'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

interface AdPlaceholderProps {
  format?: 'banner' | 'sidebar' | 'inline'
  className?: string
}

function useAdFreeStatus() {
  const [hasPremium, setHasPremium] = useState<boolean | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setHasPremium(false)
        return
      }
      supabase
        .from('purchases')
        .select('id')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: purchase }) => {
          setHasPremium(!!purchase)
        })
    })
  }, [])
  return hasPremium
}

export function AdPlaceholder({ format = 'banner', className = '' }: AdPlaceholderProps) {
  const hasPremium = useAdFreeStatus()
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (hasPremium !== false) return
    if (pushed.current) return
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // AdSense not loaded yet or ad blocker active
    }
  }, [hasPremium])

  // Hide ads for premium users, or while loading auth state
  if (hasPremium !== false) return null

  const adStyles: Record<string, { display: string; width?: string; height?: string }> = {
    banner: { display: 'block', width: '100%', height: '90px' },
    sidebar: { display: 'inline-block', width: '300px', height: '250px' },
    inline: { display: 'block', width: '100%', height: '250px' },
  }

  return (
    <div className={`print:hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={adStyles[format]}
        data-ad-client="ca-pub-7968073666840898"
        data-ad-format={format === 'banner' ? 'horizontal' : format === 'sidebar' ? 'rectangle' : 'auto'}
        data-full-width-responsive={format !== 'sidebar' ? 'true' : 'false'}
      />
    </div>
  )
}

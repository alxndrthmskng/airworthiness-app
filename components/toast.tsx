'use client'

import { useState, useRef, useCallback } from 'react'

type ToastVariant = 'success' | 'error'

interface ToastState {
  message: string
  variant: ToastVariant
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((message: string, variant: ToastVariant = 'success') => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ message, variant })
    timer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setToast(null)
  }, [])

  return { toast, show, dismiss }
}

export function Toast({ message, variant = 'success' }: { message: string; variant?: ToastVariant }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-foreground text-background text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-fade-in-up">
      {variant === 'success' ? (
        <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
    </div>
  )
}

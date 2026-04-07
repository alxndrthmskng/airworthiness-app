'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  /** Array of image URLs */
  urls: string[]
  /** Optional thumbnail wrapper class — applied to the grid container */
  gridClassName?: string
}

/**
 * Photo grid + click-to-fullscreen lightbox.
 *
 * Renders a grid of thumbnails (1, 2, or 4-up). Clicking any photo opens
 * a fullscreen overlay with arrow-key navigation between photos and
 * Esc to close.
 *
 * Used inside post cards for task_share posts and could be reused for
 * any other photo grid.
 */
export function ImageLightbox({ urls, gridClassName }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const prev = useCallback(() => {
    setOpenIndex(i => (i === null ? null : (i - 1 + urls.length) % urls.length))
  }, [urls.length])
  const next = useCallback(() => {
    setOpenIndex(i => (i === null ? null : (i + 1) % urls.length))
  }, [urls.length])

  useEffect(() => {
    if (openIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [openIndex, close, prev, next])

  if (urls.length === 0) return null

  const gridCols =
    urls.length === 1 ? 'grid-cols-1'
    : urls.length === 2 ? 'grid-cols-2'
    : 'grid-cols-2'

  return (
    <>
      <div className={gridClassName ?? `grid gap-1.5 mt-2 ${gridCols}`}>
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="block w-full aspect-square overflow-hidden rounded-lg border border-border/60 hover:opacity-90 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
                aria-label="Previous"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
                aria-label="Next"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[openIndex]}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />

          {urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
              {openIndex + 1} of {urls.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}

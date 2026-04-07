'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PostCard } from './post-card'

interface FeedPost {
  id: string
  author_id: string
  post_type: string
  data: Record<string, unknown>
  created_at: string
  author_public_id: string
  author_display_name: string
  author_avatar_path: string | null
}

interface PostWithMedia {
  post: FeedPost
  avatarUrl: string | null
  photoUrls: string[]
}

interface Props {
  initial: PostWithMedia[]
  initialHasMore: boolean
  currentUserId: string
}

export function FeedList({ initial, initialHasMore, currentUserId }: Props) {
  const [items, setItems] = useState<PostWithMedia[]>(initial)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMore() {
    if (!hasMore || loading) return
    const last = items[items.length - 1]
    if (!last) return
    setLoading(true)
    setError(null)
    const url = new URL('/api/feed', window.location.origin)
    url.searchParams.set('before', last.post.created_at)
    url.searchParams.set('limit', '25')
    const res = await fetch(url.toString())
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to load')
      return
    }
    const data = await res.json()
    setItems(prev => [...prev, ...(data.posts as PostWithMedia[])])
    setHasMore(data.hasMore)
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {items.map(({ post, avatarUrl, photoUrls }) => (
        <PostCard
          key={post.id}
          post={post}
          avatarUrl={avatarUrl}
          photoUrls={photoUrls}
          isOwn={post.author_id === currentUserId}
        />
      ))}
      {hasMore && (
        <div className="pt-4 text-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loading} aria-busy={loading}>
            {loading ? 'Loading...' : 'Load more'}
          </Button>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}

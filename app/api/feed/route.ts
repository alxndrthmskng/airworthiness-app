import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'

/**
 * Paginated feed endpoint. Used by the "Load more" button on /feed.
 *
 * Query params:
 * - before: ISO timestamp cursor (returns posts strictly older than this)
 * - limit: number of posts to return (default 25, max 50)
 *
 * Returns the posts plus resolved photo and avatar URLs so the client
 * can render them without additional fetches.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_feed', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const url = new URL(request.url)
  const before = url.searchParams.get('before')
  const limitParam = url.searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitParam ?? '25', 10) || 25, 1), 50)

  const { data: posts, error } = await supabase.rpc('get_feed', {
    p_limit: limit,
    p_before: before || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type Post = {
    id: string
    author_id: string
    post_type: string
    data: Record<string, unknown>
    created_at: string
    author_handle: string
    author_display_name: string
    author_avatar_path: string | null
  }

  const list = (posts as Post[]) ?? []

  // Resolve avatar and photo URLs server-side
  const enriched = list.map(post => {
    const avatarUrl = post.author_avatar_path
      ? supabase.storage.from('public-profile-avatars').getPublicUrl(post.author_avatar_path).data.publicUrl
      : null

    let photoUrls: string[] = []
    if (post.post_type === 'task_share') {
      const photos = (post.data as { photos?: unknown }).photos
      if (Array.isArray(photos)) {
        photoUrls = photos
          .filter((p): p is string => typeof p === 'string')
          .map(path => supabase.storage.from('post-photos').getPublicUrl(path).data.publicUrl)
      }
    }

    return { post, avatarUrl, photoUrls }
  })

  return NextResponse.json({ posts: enriched, hasMore: list.length === limit })
}

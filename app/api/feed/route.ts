import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryAll } from '@/lib/db'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { getPublicUrl } from '@/lib/storage'

export async function GET(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_feed', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const url = new URL(request.url)
  const before = url.searchParams.get('before')
  const limitParam = url.searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitParam ?? '25', 10) || 25, 1), 50)

  const posts = await queryAll<{
    id: string
    author_id: string
    post_type: string
    data: Record<string, unknown>
    created_at: string
    author_public_id: string
    author_display_name: string
    author_avatar_path: string | null
  }>(
    'SELECT * FROM get_feed($1, $2)',
    [limit, before || null]
  )

  const enriched = posts.map(post => {
    const avatarUrl = post.author_avatar_path
      ? getPublicUrl('public-profile-avatars', post.author_avatar_path)
      : null

    let photoUrls: string[] = []
    if (post.post_type === 'task_share') {
      const photos = (post.data as { photos?: unknown }).photos
      if (Array.isArray(photos)) {
        photoUrls = photos
          .filter((p): p is string => typeof p === 'string')
          .map(path => getPublicUrl('post-photos', path))
      }
    }

    return { post, avatarUrl, photoUrls }
  })

  return NextResponse.json({ posts: enriched, hasMore: posts.length === limit })
}

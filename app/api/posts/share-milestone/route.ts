import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { POST_TYPES, isValidPostType } from '@/lib/post-types'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_feed', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const profile = await queryOne<{ user_id: string }>('SELECT user_id FROM public_profiles WHERE user_id = $1', [user.id])
  if (!profile) {
    return NextResponse.json({ error: 'You must enable a public profile before sharing to the feed' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.post_type !== 'string') {
    return NextResponse.json({ error: 'post_type is required' }, { status: 400 })
  }

  const postType: string = body.post_type
  if (!isValidPostType(postType)) {
    return NextResponse.json({ error: 'Unknown post_type' }, { status: 400 })
  }

  const validation = POST_TYPES[postType].validate(body.data)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const visibility = body.visibility === 'public' ? 'public' : 'followers'

  const insertedPost = await queryOne<{ id: string; created_at: string }>(
    'INSERT INTO posts (author_id, post_type, data, visibility) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
    [user.id, body.post_type, JSON.stringify(validation.data), visibility]
  )

  await logPrivacyEvent({
    eventType: 'milestone_shared',
    eventCategory: 'social',
    metadata: { post_type: body.post_type, visibility, post_id: insertedPost!.id },
  })

  return NextResponse.json({ success: true, post_id: insertedPost!.id, created_at: insertedPost!.created_at })
}

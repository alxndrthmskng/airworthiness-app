import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { POST_TYPES, isValidPostType } from '@/lib/post-types'

/**
 * Share a milestone to the feed.
 *
 * Body: { post_type: string, data: object, visibility?: 'followers' | 'public' }
 *
 * Validates the post type and the payload shape, then creates a row in
 * the posts table. Logs to privacy audit.
 *
 * Gated on social_feed feature flag (per-user, soft launch capable).
 *
 * Note: the user must have a public_profiles row to share — the feed
 * query joins on public_profiles, so a post from a user without a
 * profile would be invisible.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_feed', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  // The user must have a public profile row, otherwise no one can see the post
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!profile) {
    return NextResponse.json(
      { error: 'You must enable a public profile before sharing to the feed' },
      { status: 400 }
    )
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

  const { data: insertedPost, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      post_type: body.post_type,
      data: validation.data,
      visibility,
    })
    .select('id, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'milestone_shared',
    eventCategory: 'social',
    metadata: { post_type: body.post_type, visibility, post_id: insertedPost.id },
  })

  return NextResponse.json({ success: true, post_id: insertedPost.id, created_at: insertedPost.created_at })
}

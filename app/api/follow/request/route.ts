import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'

/**
 * Accept or decline a pending follow request.
 *
 * Body: { followerPublicId: string, action: 'accept' | 'decline' }
 *
 * - accept: sets status='active' on the row
 * - decline: deletes the row
 *
 * The current user must be the followed user (i.e. the recipient of
 * the request). RLS enforces this.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_follow', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (
    !body ||
    typeof body.followerPublicId !== 'string' ||
    (body.action !== 'accept' && body.action !== 'decline')
  ) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Resolve the follower handle
  const { data: follower } = await supabase
    .from('public_profiles')
    .select('user_id')
    .eq('public_id', body.followerPublicId)
    .maybeSingle()

  if (!follower) {
    return NextResponse.json({ error: 'Follower not found' }, { status: 404 })
  }

  if (body.action === 'accept') {
    const { error } = await supabase
      .from('follows')
      .update({ status: 'active', accepted_at: new Date().toISOString() })
      .eq('follower_id', follower.user_id)
      .eq('followed_id', user.id)
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logPrivacyEvent({
      eventType: 'follow_accepted',
      eventCategory: 'social',
      metadata: { follower_public_id: body.followerPublicId },
    })

    // Notify the original requester that their request was accepted
    await supabase.rpc('create_notification', {
      p_recipient_id: follower.user_id,
      p_notification_type: 'follow_accepted',
      p_data: {},
    })
  } else {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', follower.user_id)
      .eq('followed_id', user.id)
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logPrivacyEvent({
      eventType: 'follow_declined',
      eventCategory: 'social',
      metadata: { follower_public_id: body.followerPublicId },
    })
  }

  return NextResponse.json({ success: true })
}

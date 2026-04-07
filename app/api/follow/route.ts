import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'

/**
 * Follow another user.
 *
 * Body: { targetPublicId: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_follow', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetPublicId !== 'string' || !/^[0-9]{8}$/.test(body.targetPublicId)) {
    return NextResponse.json({ error: 'targetPublicId is required' }, { status: 400 })
  }

  const { data: target } = await supabase
    .from('public_profiles')
    .select('user_id, is_public')
    .eq('public_id', body.targetPublicId)
    .maybeSingle()

  if (!target || !target.is_public) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const { data: blockExists } = await supabase
    .from('blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${target.user_id}),and(blocker_id.eq.${target.user_id},blocked_id.eq.${user.id})`)
    .maybeSingle()
  if (blockExists) {
    return NextResponse.json({ error: 'Cannot follow this user' }, { status: 403 })
  }

  const status = 'active'

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      followed_id: target.user_id,
      status,
      accepted_at: status === 'active' ? new Date().toISOString() : null,
    })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ success: true, status, alreadyFollowing: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: status === 'active' ? 'follow_created' : 'follow_requested',
    eventCategory: 'social',
    metadata: { target_public_id: body.targetPublicId },
  })

  await supabase.rpc('create_notification', {
    p_recipient_id: target.user_id,
    p_notification_type: status === 'active' ? 'new_follower' : 'follow_requested',
    p_data: { target_public_id: body.targetPublicId },
  })

  return NextResponse.json({ success: true, status })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_follow', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetPublicId !== 'string' || !/^[0-9]{8}$/.test(body.targetPublicId)) {
    return NextResponse.json({ error: 'targetPublicId is required' }, { status: 400 })
  }

  const { data: target } = await supabase
    .from('public_profiles')
    .select('user_id')
    .eq('public_id', body.targetPublicId)
    .maybeSingle()

  if (!target) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('followed_id', target.user_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'unfollowed',
    eventCategory: 'social',
    metadata: { target_public_id: body.targetPublicId },
  })

  return NextResponse.json({ success: true })
}

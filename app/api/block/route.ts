import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'

/**
 * Block a user.
 *
 * Body: { targetPublicId: string }
 *
 * Effects:
 * - Inserts a row in blocks (blocker = current user, blocked = target)
 * - Removes any existing follows in BOTH directions between the users
 * - Future follow attempts in either direction will be rejected
 * - The blocked user sees the blocker's profile as 404 (and vice versa)
 * - The blocked user's posts are excluded from the blocker's feed (and vice versa)
 *
 * The block is invisible to the blocked user — no notification is created,
 * and the blocker's profile simply becomes inaccessible.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetPublicId !== 'string') {
    return NextResponse.json({ error: 'targetPublicId is required' }, { status: 400 })
  }

  const { data: target } = await supabase
    .from('public_profiles')
    .select('user_id')
    .eq('public_id', body.targetPublicId)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
  }

  // Insert the block (idempotent)
  const { error: insertError } = await supabase
    .from('blocks')
    .insert({ blocker_id: user.id, blocked_id: target.user_id })

  if (insertError && insertError.code !== '23505') {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Tear down existing follows in both directions
  await supabase
    .from('follows')
    .delete()
    .or(`and(follower_id.eq.${user.id},followed_id.eq.${target.user_id}),and(follower_id.eq.${target.user_id},followed_id.eq.${user.id})`)

  await logPrivacyEvent({
    eventType: 'user_blocked',
    eventCategory: 'social',
    metadata: { target_public_id: body.targetPublicId },
  })

  return NextResponse.json({ success: true })
}

/**
 * Unblock a user.
 *
 * Body: { targetPublicId: string }
 *
 * Removes the block. Does NOT restore any follows that were torn down
 * when the block was created — the user has to follow again if they want.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetPublicId !== 'string') {
    return NextResponse.json({ error: 'targetPublicId is required' }, { status: 400 })
  }

  const { data: target } = await supabase
    .from('public_profiles')
    .select('user_id')
    .eq('public_id', body.targetPublicId)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', target.user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logPrivacyEvent({
    eventType: 'user_unblocked',
    eventCategory: 'social',
    metadata: { target_public_id: body.targetPublicId },
  })

  return NextResponse.json({ success: true })
}

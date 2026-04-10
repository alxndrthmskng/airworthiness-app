import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_follow', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetPublicId !== 'string' || !/^[0-9]{8}$/.test(body.targetPublicId)) {
    return NextResponse.json({ error: 'targetPublicId is required' }, { status: 400 })
  }

  const target = await queryOne<{ user_id: string; is_public: boolean }>(
    'SELECT user_id, is_public FROM public_profiles WHERE public_id = $1', [body.targetPublicId]
  )
  if (!target || !target.is_public) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }
  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const blockExists = await queryOne(
    'SELECT blocker_id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
    [user.id, target.user_id]
  )
  if (blockExists) {
    return NextResponse.json({ error: 'Cannot follow this user' }, { status: 403 })
  }

  const status = 'active'

  try {
    await query(
      'INSERT INTO follows (follower_id, followed_id, status, accepted_at) VALUES ($1, $2, $3, $4)',
      [user.id, target.user_id, status, status === 'active' ? new Date().toISOString() : null]
    )
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ success: true, status, alreadyFollowing: true })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: status === 'active' ? 'follow_created' : 'follow_requested',
    eventCategory: 'social',
    metadata: { target_public_id: body.targetPublicId },
  })

  await query('SELECT create_notification($1, $2, $3)', [
    target.user_id,
    status === 'active' ? 'new_follower' : 'follow_requested',
    JSON.stringify({ target_public_id: body.targetPublicId }),
  ])

  return NextResponse.json({ success: true, status })
}

export async function DELETE(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_follow', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetPublicId !== 'string' || !/^[0-9]{8}$/.test(body.targetPublicId)) {
    return NextResponse.json({ error: 'targetPublicId is required' }, { status: 400 })
  }

  const target = await queryOne<{ user_id: string }>('SELECT user_id FROM public_profiles WHERE public_id = $1', [body.targetPublicId])
  if (!target) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  await query('DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2', [user.id, target.user_id])

  await logPrivacyEvent({
    eventType: 'unfollowed',
    eventCategory: 'social',
    metadata: { target_public_id: body.targetPublicId },
  })

  return NextResponse.json({ success: true })
}

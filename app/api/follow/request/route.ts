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
  if (!body || typeof body.followerPublicId !== 'string' || (body.action !== 'accept' && body.action !== 'decline')) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const follower = await queryOne<{ user_id: string }>('SELECT user_id FROM public_profiles WHERE public_id = $1', [body.followerPublicId])
  if (!follower) {
    return NextResponse.json({ error: 'Follower not found' }, { status: 404 })
  }

  if (body.action === 'accept') {
    await query(
      "UPDATE follows SET status = 'active', accepted_at = NOW() WHERE follower_id = $1 AND followed_id = $2 AND status = 'pending'",
      [follower.user_id, user.id]
    )

    await logPrivacyEvent({
      eventType: 'follow_accepted',
      eventCategory: 'social',
      metadata: { follower_public_id: body.followerPublicId },
    })

    await query('SELECT create_notification($1, $2, $3)', [
      follower.user_id, 'follow_accepted', '{}'
    ])
  } else {
    await query(
      "DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2 AND status = 'pending'",
      [follower.user_id, user.id]
    )

    await logPrivacyEvent({
      eventType: 'follow_declined',
      eventCategory: 'social',
      metadata: { follower_public_id: body.followerPublicId },
    })
  }

  return NextResponse.json({ success: true })
}

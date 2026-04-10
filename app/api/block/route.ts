import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { logPrivacyEvent } from '@/lib/privacy-audit'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetPublicId !== 'string') {
    return NextResponse.json({ error: 'targetPublicId is required' }, { status: 400 })
  }

  const target = await queryOne<{ user_id: string }>('SELECT user_id FROM public_profiles WHERE public_id = $1', [body.targetPublicId])
  if (!target) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
  }

  try {
    await query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)', [user.id, target.user_id])
  } catch (err: any) {
    if (err?.code !== '23505') {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  await query(
    'DELETE FROM follows WHERE (follower_id = $1 AND followed_id = $2) OR (follower_id = $2 AND followed_id = $1)',
    [user.id, target.user_id]
  )

  await logPrivacyEvent({
    eventType: 'user_blocked',
    eventCategory: 'social',
    metadata: { target_public_id: body.targetPublicId },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetPublicId !== 'string') {
    return NextResponse.json({ error: 'targetPublicId is required' }, { status: 400 })
  }

  const target = await queryOne<{ user_id: string }>('SELECT user_id FROM public_profiles WHERE public_id = $1', [body.targetPublicId])
  if (!target) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  await query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2', [user.id, target.user_id])

  await logPrivacyEvent({
    eventType: 'user_unblocked',
    eventCategory: 'social',
    metadata: { target_public_id: body.targetPublicId },
  })

  return NextResponse.json({ success: true })
}

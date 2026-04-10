export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_profile', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || body.consent !== true) {
    return NextResponse.json({ error: 'Consent confirmation required' }, { status: 400 })
  }

  const existing = await queryOne<{ public_id: string; is_public: boolean }>('SELECT public_id, is_public FROM public_profiles WHERE user_id = $1', [user.id])

  if (existing) {
    await query('UPDATE public_profiles SET is_public = true WHERE user_id = $1', [user.id])
    await logPrivacyEvent({
      eventType: 'profile_opted_in',
      eventCategory: 'profile',
      metadata: { reactivation: true },
    })
    return NextResponse.json({ success: true, public_id: existing.public_id, isNew: false })
  }

  const inserted = await queryOne<{ public_id: string }>(
    'INSERT INTO public_profiles (user_id, is_public) VALUES ($1, true) RETURNING public_id',
    [user.id]
  )

  if (!inserted) {
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'profile_opted_in',
    eventCategory: 'profile',
    metadata: { reactivation: false },
  })

  return NextResponse.json({ success: true, public_id: inserted.public_id, isNew: true })
}

export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { logPrivacyEvent } from '@/lib/privacy-audit'

export async function POST() {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const existing = await queryOne<{ is_public: boolean }>('SELECT is_public FROM public_profiles WHERE user_id = $1', [user.id])

  if (!existing || !existing.is_public) {
    return NextResponse.json({ success: true, alreadyPrivate: true })
  }

  await query('UPDATE public_profiles SET is_public = false WHERE user_id = $1', [user.id])

  await logPrivacyEvent({
    eventType: 'profile_opted_out',
    eventCategory: 'profile',
  })

  return NextResponse.json({ success: true, alreadyPrivate: false })
}

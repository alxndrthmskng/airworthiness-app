export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logPrivacyEvent } from '@/lib/privacy-audit'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || (body.choice !== 'accepted' && body.choice !== 'rejected')) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const session = await auth()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ success: true, logged: false })
  }

  await logPrivacyEvent({
    eventType: body.choice === 'accepted' ? 'cookies_accepted' : 'cookies_rejected',
    eventCategory: 'consent',
    metadata: { source: 'cookie_banner' },
  })

  return NextResponse.json({ success: true, logged: true })
}

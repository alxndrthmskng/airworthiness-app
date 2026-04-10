import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { CURRENT_PRIVACY_POLICY_VERSION } from '@/lib/privacy-policy'

export async function POST() {
  const session = await auth()
  const user = session?.user
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  await query(
    `INSERT INTO privacy_policy_acknowledgements (user_id, version, acknowledged_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET version = $2, acknowledged_at = NOW()`,
    [user.id, CURRENT_PRIVACY_POLICY_VERSION]
  )

  await logPrivacyEvent({
    eventType: 'privacy_policy_acknowledged',
    eventCategory: 'consent',
    metadata: { version: CURRENT_PRIVACY_POLICY_VERSION },
  })

  return NextResponse.json({ success: true })
}

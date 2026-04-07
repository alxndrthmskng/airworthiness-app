import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { CURRENT_PRIVACY_POLICY_VERSION } from '@/lib/privacy-policy'

/**
 * Records that the authenticated user has acknowledged the current
 * version of the privacy policy. Idempotent.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { error } = await supabase
    .from('privacy_policy_acknowledgements')
    .upsert({
      user_id: user.id,
      version: CURRENT_PRIVACY_POLICY_VERSION,
      acknowledged_at: new Date().toISOString(),
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'privacy_policy_acknowledged',
    eventCategory: 'consent',
    metadata: { version: CURRENT_PRIVACY_POLICY_VERSION },
  })

  return NextResponse.json({ success: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'

/**
 * Opt out of the public profile feature.
 *
 * Sets is_public = false on the user's `public_profiles` row. The row
 * itself is preserved (along with the handle reservation) so the user
 * can re-enable later without losing their handle.
 *
 * Idempotent: opting out twice does not error.
 *
 * NOT gated on the social_profile feature flag — users must always be
 * able to opt out, even if the feature is being killed via the kill switch.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { data: existing } = await supabase
    .from('public_profiles')
    .select('is_public')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    // Nothing to opt out of — return success silently for idempotency
    return NextResponse.json({ success: true, alreadyPrivate: true })
  }

  if (!existing.is_public) {
    // Already private
    return NextResponse.json({ success: true, alreadyPrivate: true })
  }

  const { error } = await supabase
    .from('public_profiles')
    .update({ is_public: false })
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'profile_opted_out',
    eventCategory: 'profile',
  })

  return NextResponse.json({ success: true, alreadyPrivate: false })
}

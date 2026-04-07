import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'

/**
 * Opt in to the public profile feature.
 *
 * Creates a `public_profiles` row for the authenticated user, with
 * `is_public = true` and a temporary handle derived from their full name.
 * The user is then directed to /settings/profile-handle to choose their
 * permanent handle.
 *
 * The body must contain `consent: true` to confirm the user has read and
 * agreed to the consent text shown in the modal. This is recorded in the
 * privacy audit log as evidence of explicit, informed, opt-in consent.
 *
 * Idempotent: if the user already has a public_profiles row, sets
 * is_public = true and logs the event.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (!(await isFeatureEnabledForUser('social_profile', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || body.consent !== true) {
    return NextResponse.json(
      { error: 'Consent confirmation required' },
      { status: 400 }
    )
  }

  // Look up the existing row, if any
  const { data: existing } = await supabase
    .from('public_profiles')
    .select('handle, is_public')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Re-enable: just flip the flag
    const { error } = await supabase
      .from('public_profiles')
      .update({ is_public: true })
      .eq('user_id', user.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    await logPrivacyEvent({
      eventType: 'profile_opted_in',
      eventCategory: 'profile',
      metadata: { reactivation: true },
    })
    return NextResponse.json({ success: true, handle: existing.handle, isNew: false })
  }

  // First-time opt-in: generate a temporary handle and create the row.
  // Handle format must match the database constraint: [a-z0-9-]{3,30}
  const tempHandle = await generateTemporaryHandle(user.id, supabase)

  const { error: insertError } = await supabase
    .from('public_profiles')
    .insert({
      user_id: user.id,
      handle: tempHandle,
      is_public: true,
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'profile_opted_in',
    eventCategory: 'profile',
    metadata: { reactivation: false, handle_generated: true },
  })

  return NextResponse.json({ success: true, handle: tempHandle, isNew: true })
}

/**
 * Generate a unique temporary handle for a new opt-in.
 *
 * Strategy: try `user-{first 8 of uuid}` first. If somehow taken (collision
 * is statistically near-impossible), append more uuid chars. Always satisfies
 * the [a-z0-9-]{3,30} constraint.
 */
async function generateTemporaryHandle(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const base = userId.replace(/-/g, '').toLowerCase().slice(0, 8)
  let candidate = `user-${base}`

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data } = await supabase
      .from('public_profiles')
      .select('handle')
      .eq('handle', candidate)
      .maybeSingle()
    if (!data) return candidate
    candidate = `user-${base}-${attempt}`
  }
  // Extremely unlikely fallback
  return `user-${userId.replace(/-/g, '').toLowerCase().slice(0, 16)}`
}

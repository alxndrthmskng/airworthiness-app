import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'

/**
 * Opt in to the public profile feature.
 *
 * Creates a `public_profiles` row for the authenticated user, with
 * `is_public = true`. The 8-digit `public_id` is allocated by a database
 * trigger from the `generate_public_id()` function — it is random and
 * never reused after deletion.
 *
 * The body must contain `consent: true` to confirm the user has read and
 * agreed to the consent text shown in the modal. This is recorded in the
 * privacy audit log as evidence of explicit, informed, opt-in consent.
 *
 * Idempotent: if the user already has a public_profiles row, sets
 * is_public = true and returns the existing public_id.
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

  const { data: existing } = await supabase
    .from('public_profiles')
    .select('public_id, is_public')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
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
    return NextResponse.json({ success: true, public_id: existing.public_id, isNew: false })
  }

  // First-time opt-in: insert with is_public=true. The public_id is
  // auto-allocated by the BEFORE INSERT trigger.
  const { data: inserted, error: insertError } = await supabase
    .from('public_profiles')
    .insert({ user_id: user.id, is_public: true })
    .select('public_id')
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? 'Failed to create profile' }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'profile_opted_in',
    eventCategory: 'profile',
    metadata: { reactivation: false },
  })

  return NextResponse.json({ success: true, public_id: inserted.public_id, isNew: true })
}

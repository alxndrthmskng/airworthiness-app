import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { isFeatureEnabled } from '@/lib/feature-flags'

const HANDLE_REGEX = /^[a-z0-9-]{3,30}$/

// Reserved handles to prevent users claiming routes that look like system pages
const RESERVED_HANDLES = new Set([
  'admin', 'api', 'app', 'auth', 'cookies', 'dashboard', 'engineers',
  'help', 'home', 'login', 'logbook', 'logout', 'me', 'modules',
  'new', 'privacy', 'profile', 'register', 'settings', 'signup',
  'support', 'terms', 'training', 'u', 'user', 'users',
])

/**
 * Update the authenticated user's public profile handle.
 *
 * Validates:
 * - Format: [a-z0-9-]{3,30}
 * - Not reserved
 * - Not already taken
 *
 * Logs the change to the privacy audit log.
 */
export async function POST(request: Request) {
  if (!(await isFeatureEnabled('social_profile'))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.handle !== 'string') {
    return NextResponse.json({ error: 'handle is required' }, { status: 400 })
  }

  const handle = body.handle.trim().toLowerCase()

  if (!HANDLE_REGEX.test(handle)) {
    return NextResponse.json(
      { error: 'Handle must be 3-30 characters, lowercase letters, numbers, and hyphens only' },
      { status: 400 }
    )
  }

  if (RESERVED_HANDLES.has(handle)) {
    return NextResponse.json({ error: 'This handle is reserved' }, { status: 400 })
  }

  // The user must already have a public_profiles row to update the handle
  const { data: existing } = await supabase
    .from('public_profiles')
    .select('handle')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { error: 'You must opt in to a public profile before choosing a handle' },
      { status: 400 }
    )
  }

  if (existing.handle === handle) {
    // No change
    return NextResponse.json({ success: true, handle, unchanged: true })
  }

  // Check uniqueness explicitly to give a friendly error rather than a constraint violation
  const { data: taken } = await supabase
    .from('public_profiles')
    .select('user_id')
    .eq('handle', handle)
    .maybeSingle()

  if (taken) {
    return NextResponse.json({ error: 'Handle is already taken' }, { status: 409 })
  }

  const { error } = await supabase
    .from('public_profiles')
    .update({ handle })
    .eq('user_id', user.id)

  if (error) {
    // Race condition: someone else took the handle between the check and the write
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Handle is already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'handle_changed',
    eventCategory: 'profile',
    metadata: { previous_handle: existing.handle },
  })

  return NextResponse.json({ success: true, handle, unchanged: false })
}

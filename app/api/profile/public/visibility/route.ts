export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'

const VALID_TOGGLES = new Set([
  'show_employment_status',
  'show_years_in_industry',
  'show_apprenticeship',
  'show_continuation_training_status',
  'show_first_endorsement_dates',
  'display_name_first_only',
])

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_profile', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.field !== 'string' || typeof body.value !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!VALID_TOGGLES.has(body.field)) {
    return NextResponse.json({ error: 'Unknown field' }, { status: 400 })
  }

  // Use parameterized column name safely since we validated against allowlist
  await query(`UPDATE public_profiles SET ${body.field} = $1 WHERE user_id = $2`, [body.value, user.id])

  await logPrivacyEvent({
    eventType: 'visibility_changed',
    eventCategory: 'profile',
    metadata: { field: body.field, value: body.value },
  })

  return NextResponse.json({ success: true })
}

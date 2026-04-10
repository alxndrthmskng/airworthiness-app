export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

// Allowlisted fields that can be updated via this generic endpoint
const ALLOWED_FIELDS = new Set([
  'full_name', 'aml_licence_number', 'aml_categories', 'is_public',
  'licence_entries', 'type_endorsements', 'btc_completed_at',
  'dashboard_layout', 'hidden_widgets', 'assessment_passed_at',
  'assessment_score', 'assessment_answers',
])

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Filter to only allowed fields
  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      updates[key] = value
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Build parameterized SET clause
  const setClauses: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(updates)) {
    // For JSON/JSONB fields, stringify the value
    const needsJson = ['aml_categories', 'licence_entries', 'type_endorsements', 'dashboard_layout', 'hidden_widgets', 'assessment_answers'].includes(key)
    setClauses.push(`${key} = $${paramIndex}`)
    values.push(needsJson && value !== null ? JSON.stringify(value) : value)
    paramIndex++
  }

  values.push(user.id)
  await query(`UPDATE profiles SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values)

  return NextResponse.json({ success: true })
}

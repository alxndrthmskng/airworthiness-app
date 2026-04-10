import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.score !== 'number' || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  await query(
    'UPDATE profiles SET assessment_passed_at = $1, assessment_score = $2, assessment_answers = $3 WHERE id = $4',
    [body.passed ? new Date().toISOString() : null, body.score, JSON.stringify(body.answers), user.id]
  )

  return NextResponse.json({ success: true })
}

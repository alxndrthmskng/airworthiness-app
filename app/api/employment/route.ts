import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.employer_name !== 'string') {
    return NextResponse.json({ error: 'employer_name is required' }, { status: 400 })
  }

  await query(
    `INSERT INTO employment_history (user_id, employer_name, start_date, end_date, is_current, is_military)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, body.employer_name, body.start_date, body.end_date || null, body.is_current ?? false, body.is_military ?? false]
  )

  return NextResponse.json({ success: true })
}

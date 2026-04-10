import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  if (body.action === 'add') {
    await query(
      `INSERT INTO employment_history (user_id, employer_name, start_date, end_date, is_current, is_military)
       VALUES ($1, $2, $3, $4, false, true)`,
      [user.id, body.employer_name || 'Military Service', body.start_date, body.end_date]
    )
  } else if (body.action === 'remove' && body.id) {
    await query('DELETE FROM employment_history WHERE id = $1 AND user_id = $2 AND is_military = true', [body.id, user.id])
  }

  return NextResponse.json({ success: true })
}

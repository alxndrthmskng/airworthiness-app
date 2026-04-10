export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.course_id !== 'string') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  await query(
    `INSERT INTO certificates (user_id, course_id, score, passed_at, expires_at, token)
     VALUES ($1, $2, $3, NOW(), $4, $5)
     ON CONFLICT (user_id, course_id) DO UPDATE SET
       score = $3, passed_at = NOW(), expires_at = $4, token = $5`,
    [user.id, body.course_id, body.score, body.expires_at || null, body.token || crypto.randomUUID()]
  )

  return NextResponse.json({ success: true })
}

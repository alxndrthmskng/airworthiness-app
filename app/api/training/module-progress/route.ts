import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.course_id !== 'string' || typeof body.module_id !== 'string') {
    return NextResponse.json({ error: 'course_id and module_id are required' }, { status: 400 })
  }

  await query(
    `INSERT INTO course_module_progress (user_id, course_id, module_id, completed_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, course_id, module_id) DO UPDATE SET completed_at = NOW()`,
    [user.id, body.course_id, body.module_id]
  )

  return NextResponse.json({ success: true })
}

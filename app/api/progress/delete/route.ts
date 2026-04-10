export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || !body.module_id || !body.target_category) {
    return NextResponse.json({ error: 'module_id and target_category are required' }, { status: 400 })
  }

  await query(
    'DELETE FROM module_exam_progress WHERE user_id = $1 AND target_category = $2 AND module_id = $3',
    [user.id, body.target_category, body.module_id]
  )

  return NextResponse.json({ success: true })
}

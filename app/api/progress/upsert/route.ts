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
    `INSERT INTO module_exam_progress (user_id, target_category, module_id, status, score, essay_answer, certificate_photo_path)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, target_category, module_id)
     DO UPDATE SET status = $4, score = $5, essay_answer = $6, certificate_photo_path = COALESCE($7, module_exam_progress.certificate_photo_path)`,
    [user.id, body.target_category, body.module_id, body.status || 'completed', body.score || null, body.essay_answer || null, body.certificate_photo_path || null]
  )

  return NextResponse.json({ success: true })
}

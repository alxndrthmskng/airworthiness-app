export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryOne, queryAll } from '@/lib/db'

export async function GET() {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const profile = await queryOne('SELECT * FROM profiles WHERE id = $1', [user.id])
  const entries = await queryAll('SELECT * FROM logbook_entries WHERE user_id = $1 ORDER BY task_date DESC', [user.id])
  const certificates = await queryAll('SELECT * FROM certificates WHERE user_id = $1', [user.id])
  const progress = await queryAll('SELECT * FROM module_exam_progress WHERE user_id = $1', [user.id])
  const employment = await queryAll('SELECT * FROM employment_history WHERE user_id = $1 ORDER BY start_date DESC', [user.id])

  return NextResponse.json({
    profile,
    logbook_entries: entries,
    certificates,
    module_progress: progress,
    employment_history: employment,
    exported_at: new Date().toISOString(),
  })
}

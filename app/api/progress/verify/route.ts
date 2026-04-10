import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const profile = await queryOne<{ role: string }>('SELECT role FROM profiles WHERE id = $1', [user.id])
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { progressId, status } = body as { progressId: string; status: 'verified' | 'unverified' }

  if (!progressId || !['verified', 'unverified'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await query(
    'UPDATE module_exam_progress SET verification_status = $1, verified_by = $2, verified_at = $3 WHERE id = $4',
    [status, status === 'verified' ? user.id : null, status === 'verified' ? new Date().toISOString() : null, progressId]
  )

  return NextResponse.json({ success: true })
}

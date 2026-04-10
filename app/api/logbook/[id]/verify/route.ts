import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || (body.action !== 'approve' && body.action !== 'reject')) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (body.action === 'approve') {
    await query(
      `UPDATE logbook_entries SET status = 'verified', verified_by = $1, verified_at = NOW(), verification_comments = $2 WHERE id = $3`,
      [user.id, body.comments || null, id]
    )
  } else {
    await query(
      `UPDATE logbook_entries SET status = 'verification_rejected', verified_by = $1, verified_at = NOW(), verification_comments = $2 WHERE id = $3`,
      [user.id, body.comments || null, id]
    )
  }

  return NextResponse.json({ success: true })
}

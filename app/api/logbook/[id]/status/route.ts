import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.status !== 'string') {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  await query('UPDATE logbook_entries SET status = $1 WHERE id = $2 AND user_id = $3', [body.status, id, user.id])

  return NextResponse.json({ success: true })
}

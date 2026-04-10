import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  await query(
    'UPDATE profiles SET btc_completed_at = $1 WHERE id = $2',
    [body.completed ? new Date().toISOString() : null, user.id]
  )

  return NextResponse.json({ success: true })
}

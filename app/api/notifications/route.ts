import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST() {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await query('UPDATE notifications SET is_read = true WHERE recipient_id = $1 AND is_read = false', [user.id])

  return NextResponse.json({ success: true })
}

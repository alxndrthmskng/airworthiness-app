export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export async function GET() {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ count: 0 })

  const row = await queryOne<{ count: number }>(
    'SELECT count(*)::int AS count FROM notifications WHERE recipient_id = $1 AND is_read = false',
    [user.id],
  )

  return NextResponse.json({ count: row?.count ?? 0 })
}

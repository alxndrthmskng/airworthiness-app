import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export async function GET() {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const profile = await queryOne(
    'SELECT * FROM profiles WHERE id = $1',
    [user.id],
  )

  return NextResponse.json({ profile, user: { id: user.id, email: user.email } })
}

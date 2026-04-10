export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { isAdmin, clearFeatureFlagCache } from '@/lib/feature-flags'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = await isAdmin(user.id)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.key !== 'string' || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  await query('UPDATE feature_flags SET enabled = $1 WHERE key = $2', [body.enabled, body.key])

  clearFeatureFlagCache(body.key)

  return NextResponse.json({ success: true })
}

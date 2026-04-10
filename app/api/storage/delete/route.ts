import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { removeFiles } from '@/lib/storage'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.bucket !== 'string' || typeof body.path !== 'string') {
    return NextResponse.json({ error: 'bucket and path are required' }, { status: 400 })
  }

  // Ensure path belongs to user
  if (!body.path.startsWith(user.id + '/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
  }

  await removeFiles(body.bucket, [body.path])

  return NextResponse.json({ success: true })
}

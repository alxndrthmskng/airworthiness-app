export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createSignedUrl } from '@/lib/storage'

export async function GET(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const url = new URL(request.url)
  const bucket = url.searchParams.get('bucket')
  const path = url.searchParams.get('path')
  const ttl = parseInt(url.searchParams.get('ttl') || '3600', 10)

  if (!bucket || !path) {
    return NextResponse.json({ error: 'bucket and path are required' }, { status: 400 })
  }

  const signedUrl = await createSignedUrl(bucket, path, ttl)

  if (!signedUrl) {
    return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl })
}

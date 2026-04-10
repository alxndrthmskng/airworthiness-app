export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFile } from '@/lib/storage'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file') as File | null
  const bucket = formData.get('bucket') as string | null
  const path = formData.get('path') as string | null

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: 'file, bucket, and path are required' }, { status: 400 })
  }

  // Ensure path starts with user's ID for security
  if (!path.startsWith(user.id + '/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await uploadFile(bucket, path, Buffer.from(arrayBuffer), file.type)

  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ success: true, path })
}

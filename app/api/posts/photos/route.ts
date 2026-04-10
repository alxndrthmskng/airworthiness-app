export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { uploadFile, getPublicUrl } from '@/lib/storage'

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_task_posts', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field is required' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 })
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const random = Math.random().toString(36).slice(2, 10)
  const path = `${user.id}/orphan/${Date.now()}-${random}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await uploadFile('post-photos', path, Buffer.from(arrayBuffer), file.type)

  if (uploadError) {
    return NextResponse.json({ error: uploadError }, { status: 500 })
  }

  const url = getPublicUrl('post-photos', path)
  return NextResponse.json({ success: true, path, url })
}

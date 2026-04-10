export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { uploadFile, removeFiles, getPublicUrl } from '@/lib/storage'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_profile', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const profile = await queryOne<{ avatar_path: string | null }>('SELECT avatar_path FROM public_profiles WHERE user_id = $1', [user.id])
  if (!profile) {
    return NextResponse.json({ error: 'You must enable a public profile before uploading an avatar' }, { status: 400 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'file field is required' }, { status: 400 })

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 })
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await uploadFile('public-profile-avatars', path, Buffer.from(arrayBuffer), file.type)
  if (uploadError) return NextResponse.json({ error: uploadError }, { status: 500 })

  await query('UPDATE public_profiles SET avatar_path = $1 WHERE user_id = $2', [path, user.id])

  if (profile.avatar_path && profile.avatar_path !== path) {
    await removeFiles('public-profile-avatars', [profile.avatar_path])
  }

  await logPrivacyEvent({
    eventType: 'avatar_uploaded',
    eventCategory: 'profile',
    metadata: { size_bytes: file.size, content_type: file.type },
  })

  const url = getPublicUrl('public-profile-avatars', path)
  return NextResponse.json({ success: true, path, url })
}

export async function DELETE() {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_profile', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const profile = await queryOne<{ avatar_path: string | null }>('SELECT avatar_path FROM public_profiles WHERE user_id = $1', [user.id])
  if (!profile?.avatar_path) {
    return NextResponse.json({ success: true, alreadyEmpty: true })
  }

  await removeFiles('public-profile-avatars', [profile.avatar_path])
  await query('UPDATE public_profiles SET avatar_path = NULL WHERE user_id = $1', [user.id])

  await logPrivacyEvent({
    eventType: 'avatar_removed',
    eventCategory: 'profile',
  })

  return NextResponse.json({ success: true })
}

export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { uploadFile } from '@/lib/storage'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const slug = formData.get('slug') as string | null

  if (!file || !slug) return NextResponse.json({ error: 'No file or slug provided' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, PDF' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const storagePath = `${user.id}/${slug}-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await uploadFile('training-certificates', storagePath, Buffer.from(arrayBuffer), file.type)
  if (uploadError) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

  await query('UPDATE external_training_certificates SET certificate_path = $1 WHERE user_id = $2 AND training_slug = $3', [storagePath, user.id, slug])

  return NextResponse.json({ path: storagePath })
}

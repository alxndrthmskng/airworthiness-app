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
  const moduleId = formData.get('module_id') as string | null
  const targetCategory = formData.get('target_category') as string | null

  if (!file || !moduleId || !targetCategory) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, PDF' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const storagePath = `${user.id}/${moduleId}-${targetCategory}-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await uploadFile('module-certificates', storagePath, Buffer.from(arrayBuffer), file.type)
  if (uploadError) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

  await query(
    `INSERT INTO module_exam_progress (user_id, target_category, module_id, certificate_photo_path, verification_status)
     VALUES ($1, $2, $3, $4, 'pending')
     ON CONFLICT (user_id, target_category, module_id)
     DO UPDATE SET certificate_photo_path = $4, verification_status = 'pending'`,
    [user.id, targetCategory, moduleId, storagePath]
  )

  return NextResponse.json({ path: storagePath })
}

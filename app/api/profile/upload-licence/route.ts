import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, PDF' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const storagePath = `${user.id}/aml-licence-${timestamp}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('aml-licences')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Update the profile with the photo path and reset verification
  const { error: dbError } = await supabase
    .from('profiles')
    .update({
      aml_photo_path: storagePath,
      aml_verified: false,
    })
    .eq('id', user.id)

  if (dbError) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ path: storagePath })
}

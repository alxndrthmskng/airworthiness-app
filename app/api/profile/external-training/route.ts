import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const body = await request.json()
  const { training_slug, completion_date, certificate_path } = body

  if (!training_slug || !completion_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const completionDate = new Date(completion_date)
  const expiryDate = new Date(completionDate)
  expiryDate.setFullYear(expiryDate.getFullYear() + 2)

  await query(
    `INSERT INTO external_training_certificates (user_id, training_slug, completion_date, expiry_date${certificate_path !== undefined ? ', certificate_path' : ''})
     VALUES ($1, $2, $3, $4${certificate_path !== undefined ? ', $5' : ''})
     ON CONFLICT (user_id, training_slug) DO UPDATE SET
       completion_date = $3,
       expiry_date = $4${certificate_path !== undefined ? ', certificate_path = $5' : ''}`,
    certificate_path !== undefined
      ? [user.id, training_slug, completion_date, expiryDate.toISOString().split('T')[0], certificate_path]
      : [user.id, training_slug, completion_date, expiryDate.toISOString().split('T')[0]]
  )

  return NextResponse.json({ success: true })
}

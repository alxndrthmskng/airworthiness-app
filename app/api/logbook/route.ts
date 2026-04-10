import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  await query(
    `INSERT INTO logbook_entries (
      user_id, task_date, maintenance_type, aircraft_category,
      aircraft_registration, aircraft_type, ata_chapter, ata_chapters,
      job_number, description, employer, category, duration_hours,
      supervised, status, work_order_photo_path
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      user.id, body.task_date, body.maintenance_type, body.aircraft_category,
      body.aircraft_registration, body.aircraft_type, body.ata_chapter, body.ata_chapters,
      body.job_number, body.description, body.employer, body.category, body.duration_hours,
      body.supervised, body.status, body.work_order_photo_path,
    ]
  )

  return NextResponse.json({ success: true })
}

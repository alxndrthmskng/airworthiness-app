import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify ownership
  const entry = await queryOne<{ user_id: string }>('SELECT user_id FROM logbook_entries WHERE id = $1', [id])
  if (!entry || entry.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  await query(
    `UPDATE logbook_entries SET
      task_date = $1, maintenance_type = $2, aircraft_category = $3,
      aircraft_registration = $4, aircraft_type = $5, ata_chapter = $6,
      ata_chapters = $7, job_number = $8, description = $9, employer = $10,
      category = $11, duration_hours = $12, supervised = $13, status = $14,
      work_order_photo_path = $15, updated_at = NOW()
     WHERE id = $16 AND user_id = $17`,
    [
      body.task_date, body.maintenance_type, body.aircraft_category,
      body.aircraft_registration, body.aircraft_type, body.ata_chapter,
      body.ata_chapters, body.job_number, body.description, body.employer,
      body.category, body.duration_hours, body.supervised, body.status,
      body.work_order_photo_path, id, user.id,
    ]
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await query('DELETE FROM logbook_entries WHERE id = $1 AND user_id = $2', [id, user.id])

  return NextResponse.json({ success: true })
}

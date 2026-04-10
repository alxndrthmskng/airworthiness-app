import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const {
    full_name, date_of_birth, aml_licence_number, aml_categories,
    licence_entries, type_endorsements, employers, approved_part_145s,
  } = body

  await query(
    `UPDATE profiles SET
      full_name = $1, date_of_birth = $2, aml_licence_number = $3,
      aml_categories = $4, licence_entries = $5, type_endorsements = $6,
      profile_completed_at = NOW()
     WHERE id = $7`,
    [
      full_name, date_of_birth, aml_licence_number,
      JSON.stringify(aml_categories), JSON.stringify(licence_entries),
      JSON.stringify(type_endorsements), user.id,
    ]
  )

  // Upsert employers
  if (Array.isArray(employers)) {
    await query('DELETE FROM employment_history WHERE user_id = $1', [user.id])
    for (const emp of employers) {
      await query(
        'INSERT INTO employment_history (user_id, employer_name, start_date, end_date, is_current, is_military) VALUES ($1, $2, $3, $4, $5, $6)',
        [user.id, emp.employer_name, emp.start_date, emp.end_date || null, emp.is_current ?? false, emp.is_military ?? false]
      )
    }
  }

  // Upsert approved Part 145s
  if (Array.isArray(approved_part_145s)) {
    await query('DELETE FROM profile_approved_organisations WHERE user_id = $1', [user.id])
    for (const org of approved_part_145s) {
      if (org.organisation_id) {
        await query(
          'INSERT INTO profile_approved_organisations (user_id, organisation_id) VALUES ($1, $2)',
          [user.id, org.organisation_id]
        )
      }
    }
  }

  return NextResponse.json({ success: true })
}

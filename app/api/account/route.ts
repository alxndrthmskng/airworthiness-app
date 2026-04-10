import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function DELETE() {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Delete user data in order (respecting FK constraints)
  await query('DELETE FROM logbook_entries WHERE user_id = $1', [user.id])
  await query('DELETE FROM module_exam_progress WHERE user_id = $1', [user.id])
  await query('DELETE FROM certificates WHERE user_id = $1', [user.id])
  await query('DELETE FROM purchases WHERE user_id = $1', [user.id])
  await query('DELETE FROM profiles WHERE id = $1', [user.id])

  return NextResponse.json({ success: true })
}

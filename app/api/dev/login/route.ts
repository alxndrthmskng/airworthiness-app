import { NextResponse } from 'next/server'

/**
 * Dev-only login route — no longer needed with Auth.js.
 * Auth.js handles magic link flows natively and works with localhost.
 */
export async function POST() {
  return NextResponse.json({ error: 'Not implemented — use Auth.js sign-in flow' }, { status: 410 })
}

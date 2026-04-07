import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, clearFeatureFlagCache } from '@/lib/feature-flags'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = await isAdmin(user.id)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.key !== 'string' || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled: body.enabled })
    .eq('key', body.key)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Invalidate the in-memory cache so the change takes effect immediately
  // for this Node instance. Other instances will pick it up within 60s.
  clearFeatureFlagCache(body.key)

  return NextResponse.json({ success: true })
}

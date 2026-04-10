export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { POST_TYPES } from '@/lib/post-types'

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_task_posts', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const profile = await queryOne<{ user_id: string }>('SELECT user_id FROM public_profiles WHERE user_id = $1', [user.id])
  if (!profile) {
    return NextResponse.json({ error: 'You must enable a public profile before sharing to the feed' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.logbook_entry_id !== 'string') {
    return NextResponse.json({ error: 'logbook_entry_id is required' }, { status: 400 })
  }

  const entry = await queryOne<{
    id: string; user_id: string; task_date: string; aircraft_type: string;
    aircraft_category: string; ata_chapters: string[]; ata_chapter: string; description: string
  }>(
    'SELECT id, user_id, task_date, aircraft_type, aircraft_category, ata_chapters, ata_chapter, description FROM logbook_entries WHERE id = $1',
    [body.logbook_entry_id]
  )
  if (!entry) return NextResponse.json({ error: 'Logbook entry not found' }, { status: 404 })
  if (entry.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const taskTypeMatch = entry.description?.match(/^\[([^\]]+)\]/)
  const taskTypes = taskTypeMatch
    ? taskTypeMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean)
    : []

  const ataChapters: string[] = Array.isArray(entry.ata_chapters) && entry.ata_chapters.length > 0
    ? entry.ata_chapters
    : entry.ata_chapter ? [entry.ata_chapter] : []

  const taskSharePayload = {
    aircraft_type: entry.aircraft_type === 'N/A' ? null : entry.aircraft_type,
    aircraft_category: entry.aircraft_category ?? null,
    task_types: taskTypes,
    ata_chapters: ataChapters,
    task_date: entry.task_date,
    note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
    photos: Array.isArray(body.photoPaths) ? body.photoPaths : [],
  }

  const validation = POST_TYPES.task_share.validate(taskSharePayload)
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

  const visibility = body.visibility === 'public' ? 'public' : 'followers'

  const insertedPost = await queryOne<{ id: string; created_at: string }>(
    'INSERT INTO posts (author_id, post_type, data, visibility) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
    [user.id, 'task_share', JSON.stringify(validation.data), visibility]
  )

  await logPrivacyEvent({
    eventType: 'task_shared',
    eventCategory: 'social',
    metadata: {
      post_id: insertedPost!.id,
      logbook_entry_id: body.logbook_entry_id,
      photo_count: taskSharePayload.photos.length,
      has_note: !!taskSharePayload.note,
      visibility,
    },
  })

  return NextResponse.json({ success: true, post_id: insertedPost!.id, created_at: insertedPost!.created_at })
}

export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { MAX_TASK_NOTE_LENGTH } from '@/lib/post-types'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || (body.note !== null && typeof body.note !== 'string')) {
    return NextResponse.json({ error: 'note must be a string or null' }, { status: 400 })
  }
  if (typeof body.note === 'string' && body.note.length > MAX_TASK_NOTE_LENGTH) {
    return NextResponse.json({ error: `note must be ${MAX_TASK_NOTE_LENGTH} chars or fewer` }, { status: 400 })
  }

  const post = await queryOne<{ id: string; author_id: string; post_type: string; data: Record<string, unknown> }>(
    'SELECT id, author_id, post_type, data FROM posts WHERE id = $1', [id]
  )
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.author_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (post.post_type !== 'task_share') {
    return NextResponse.json({ error: 'Only task_share posts can be edited' }, { status: 400 })
  }

  const newData = {
    ...(post.data as Record<string, unknown>),
    note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
  }

  await query('UPDATE posts SET data = $1 WHERE id = $2', [JSON.stringify(newData), id])

  await logPrivacyEvent({
    eventType: 'post_note_edited',
    eventCategory: 'social',
    metadata: { post_id: id },
  })

  return NextResponse.json({ success: true })
}

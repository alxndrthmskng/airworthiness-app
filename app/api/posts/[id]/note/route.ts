import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { MAX_TASK_NOTE_LENGTH } from '@/lib/post-types'

/**
 * Edit the note on a task_share post.
 *
 * Body: { note: string | null }
 *
 * The author can update only the note field of their own task_share posts.
 * The structured data (aircraft type, ata chapters, etc.) is read-only
 * because it comes from the source logbook entry. Other post types
 * (module_pass, type_rating_added, training_completed) are not editable
 * because there's no free-text field to fix.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || (body.note !== null && typeof body.note !== 'string')) {
    return NextResponse.json({ error: 'note must be a string or null' }, { status: 400 })
  }
  if (typeof body.note === 'string' && body.note.length > MAX_TASK_NOTE_LENGTH) {
    return NextResponse.json({ error: `note must be ${MAX_TASK_NOTE_LENGTH} chars or fewer` }, { status: 400 })
  }

  // Load the post and verify ownership + type
  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, post_type, data')
    .eq('id', id)
    .maybeSingle()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.author_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (post.post_type !== 'task_share') {
    return NextResponse.json({ error: 'Only task_share posts can be edited' }, { status: 400 })
  }

  // Build the new data object — keep all existing fields, only update note
  const newData = {
    ...(post.data as Record<string, unknown>),
    note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
  }

  const { error } = await supabase
    .from('posts')
    .update({ data: newData })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logPrivacyEvent({
    eventType: 'post_note_edited',
    eventCategory: 'social',
    metadata: { post_id: id },
  })

  return NextResponse.json({ success: true })
}

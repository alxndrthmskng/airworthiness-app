import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { removeFiles } from '@/lib/storage'

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const post = await queryOne<{ id: string; author_id: string; post_type: string; data: Record<string, unknown> }>(
    'SELECT id, author_id, post_type, data FROM posts WHERE id = $1', [id]
  )
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.author_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const photoPaths: string[] = (() => {
    if (post.post_type !== 'task_share') return []
    const data = post.data as { photos?: unknown }
    if (!Array.isArray(data?.photos)) return []
    return data.photos.filter((p): p is string => typeof p === 'string')
  })()

  await query('DELETE FROM posts WHERE id = $1', [id])

  if (photoPaths.length > 0) {
    await removeFiles('post-photos', photoPaths)
  }

  await logPrivacyEvent({
    eventType: 'post_deleted',
    eventCategory: 'social',
    metadata: { post_id: id, post_type: post.post_type, photo_count: photoPaths.length },
  })

  return NextResponse.json({ success: true })
}

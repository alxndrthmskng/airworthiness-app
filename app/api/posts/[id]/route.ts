import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'

/**
 * Delete a post. Only the author can delete their own posts (RLS enforced).
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify ownership before delete (RLS would enforce this anyway, but explicit check
  // gives a friendlier error than a silent zero-rows-affected)
  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, post_type')
    .eq('id', id)
    .maybeSingle()

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  if (post.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'post_deleted',
    eventCategory: 'social',
    metadata: { post_id: id, post_type: post.post_type },
  })

  return NextResponse.json({ success: true })
}

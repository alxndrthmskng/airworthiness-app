import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { FollowList } from '../follow-list'

interface PageProps {
  params: Promise<{ handle: string }>
}

const HANDLE_REGEX = /^[a-z0-9-]{3,30}$/

interface Entry {
  user_id: string
  handle: string
  display_name: string
  avatar_path: string | null
  followed_since: string
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  return { title: `@${handle}'s followers | Airworthiness`, robots: { index: false, follow: false } }
}

export default async function FollowersPage({ params }: PageProps) {
  const { handle } = await params
  if (!HANDLE_REGEX.test(handle)) notFound()
  if (!(await isFeatureEnabled('social_profile'))) notFound()
  if (!(await isFeatureEnabled('social_follow'))) notFound()

  const supabase = await createClient()

  // Verify the profile exists and is public
  const { data: rows } = await supabase.rpc('get_public_profile', { p_handle: handle })
  const profile = rows?.[0]
  if (!profile) notFound()

  const { data: followers } = await supabase.rpc('get_followers', { p_handle: handle, p_limit: 200 })
  const list: Entry[] = (followers as Entry[]) ?? []

  function avatarUrlFor(path: string | null): string | null {
    if (!path) return null
    return supabase.storage.from('public-profile-avatars').getPublicUrl(path).data.publicUrl
  }

  const displayName = profile.display_name || profile.full_name || 'Engineer'

  return (
    <div className="bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href={`/u/${handle}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to {displayName}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-3 mb-6">
          Followers <span className="text-muted-foreground font-normal">· {list.length}</span>
        </h1>
        <FollowList
          entries={list}
          avatarUrlFor={avatarUrlFor}
          emptyMessage={`${displayName} doesn't have any followers yet.`}
        />
      </div>
    </div>
  )
}

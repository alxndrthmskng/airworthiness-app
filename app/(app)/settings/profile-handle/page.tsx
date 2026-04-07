import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { HandleForm } from './handle-form'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

export const metadata: Metadata = { title: 'Choose your handle | Airworthiness' }

export default async function ProfileHandlePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!(await isFeatureEnabled('social_profile'))) {
    redirect('/settings')
  }

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('handle, is_public')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    // No public profile yet — back to settings to opt in first
    redirect('/settings')
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <SidebarTriggerInline />
        <h1 className="text-2xl font-semibold text-foreground">Choose your handle</h1>
      </div>
      <div className="max-w-lg">
        <HandleForm currentHandle={profile.handle} />
      </div>
    </div>
  )
}

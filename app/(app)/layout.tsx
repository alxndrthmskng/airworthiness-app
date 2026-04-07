import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-sidebar'
import { QuickAdd } from '@/components/quick-add'
import { PrivacyPolicyBanner } from '@/components/privacy-policy-banner'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { CURRENT_PRIVACY_POLICY_VERSION } from '@/lib/privacy-policy'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_completed_at')
    .eq('id', user.id)
    .single()

  if (!profile?.profile_completed_at) redirect('/complete-profile')

  const quickAddEnabled = await isFeatureEnabled('quick_add')

  // Privacy policy acknowledgement check — show banner if user has not
  // acknowledged the current version
  const { data: ack } = await supabase
    .from('privacy_policy_acknowledgements')
    .select('version')
    .eq('user_id', user.id)
    .maybeSingle()
  const needsPolicyAck = ack?.version !== CURRENT_PRIVACY_POLICY_VERSION

  return (
    <>
      <AppSidebar />
      <main className="md:ml-60 min-h-screen bg-background relative">
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-24 animate-fade-in">
          {children}
        </div>
      </main>
      {quickAddEnabled && <QuickAdd />}
      {needsPolicyAck && <PrivacyPolicyBanner version={CURRENT_PRIVACY_POLICY_VERSION} />}
    </>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsPanel } from './settings-panel'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

export const metadata: Metadata = { title: 'Settings | Airworthiness' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <SidebarTriggerInline />
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        </div>
      </div>
      <SettingsPanel userEmail={user.email ?? ''} />
    </div>
  )
}

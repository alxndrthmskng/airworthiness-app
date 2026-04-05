'use client'

import { SidebarTrigger } from '@/components/app-sidebar'

export function SidebarTriggerInline() {
  return (
    <div className="md:hidden shrink-0 h-8 flex items-center">
      <SidebarTrigger />
    </div>
  )
}

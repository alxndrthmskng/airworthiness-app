'use client'

import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="font-bold tracking-wide uppercase hover:bg-primary hover:text-primary-foreground hover:border-primary">
      Print
    </Button>
  )
}

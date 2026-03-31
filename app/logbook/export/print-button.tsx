'use client'

import { Button } from '@/components/ui/button'

export function PrintButton() {
  function handlePrint() {
    const style = document.createElement('style')
    style.id = '__print_landscape__'
    style.innerHTML = '@page { size: A4 landscape; margin: 10mm; }'
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="border-gray-300 text-gray-700 hover:bg-[#1565C0] hover:text-white hover:border-[#1565C0] font-bold tracking-wide uppercase">
      Print
    </Button>
  )
}

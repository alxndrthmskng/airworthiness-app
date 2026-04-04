'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim()) {
      router.push(`/signup?email=${encodeURIComponent(email)}`)
    } else {
      router.push('/signup')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="h-14 text-base rounded-xl px-5"
      />
      <Button
        type="submit"
        className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/80 text-base font-semibold rounded-xl"
      >
        Log In or Sign Up
      </Button>
    </form>
  )
}

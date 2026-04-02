'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CompleteProfileForm() {
  const router = useRouter()
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [middleNames, setMiddleNames] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.')
      setLoading(false)
      return
    }

    const fullName = [firstName.trim(), middleNames.trim(), lastName.trim()].filter(Boolean).join(' ')

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', (await supabase.auth.getUser()).data.user!.id)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    await supabase.auth.updateUser({ data: { full_name: fullName } })

    router.push('/profile')
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black tracking-tight">Complete your profile</h1>
          <p className="text-sm text-gray-500 mt-2">Tell us your name to get started.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-bold text-black">First name</Label>
              <Input
                id="firstName"
                placeholder="James"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-bold text-black">Last name</Label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="middleNames" className="text-xs font-bold text-black">
              Middle name(s) <span className="text-gray-300 font-normal">optional</span>
            </Label>
            <Input
              id="middleNames"
              value={middleNames}
              onChange={e => setMiddleNames(e.target.value)}
              className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-black text-white hover:bg-gray-800 font-bold rounded-xl"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}

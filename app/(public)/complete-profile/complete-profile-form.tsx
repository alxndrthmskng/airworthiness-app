'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AML_CATEGORIES } from '@/lib/profile/constants'

const IMPLIED_CATEGORIES: Record<string, string[]> = {
  'B1.1': ['A1'],
  'B1.2': ['A2', 'B3'],
  'B1.3': ['A3'],
  'B1.4': ['A4'],
}

const APPROVAL_TYPES = [
  'Part 145 (Aircraft Maintenance)',
  'Part 145 (Engine Maintenance)',
  'Part 145 (Component Maintenance)',
  'Part CAMO (Continuing Airworthiness Management)',
  'Part 147 (Aircraft Maintenance Training)',
  'Part 21 Subpart G (Production)',
  'Part 21 Subpart J (Design)',
  'Other',
]

interface Approval {
  type: string
  reference: string
}

export function CompleteProfileForm() {
  const router = useRouter()
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [middleNames, setMiddleNames] = useState('')
  const [lastName, setLastName] = useState('')
  const [hasLicence, setHasLicence] = useState<'yes' | 'no' | ''>('')
  const [licences, setLicences] = useState<string[]>([''])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [employer, setEmployer] = useState('')
  const [approvals, setApprovals] = useState<Approval[]>([{ type: '', reference: '' }])
  const [marketingOptIn, setMarketingOptIn] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Licence helpers
  function updateLicence(index: number, value: string) {
    setLicences(prev => prev.map((l, i) => i === index ? value : l))
  }

  function removeLicence(index: number) {
    setLicences(prev => prev.filter((_, i) => i !== index))
  }

  function addLicence() {
    setLicences(prev => [...prev, ''])
  }

  // Approval helpers
  function updateApproval(index: number, field: keyof Approval, value: string) {
    setApprovals(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  function removeApproval(index: number) {
    setApprovals(prev => prev.filter((_, i) => i !== index))
  }

  function addApproval() {
    setApprovals(prev => [...prev, { type: '', reference: '' }])
  }

  // Category helpers
  function toggleCategory(cat: string) {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        const implied = IMPLIED_CATEGORIES[cat] || []
        const otherImplied = Object.entries(IMPLIED_CATEGORIES)
          .filter(([k]) => k !== cat && prev.includes(k))
          .flatMap(([, v]) => v)
        return prev
          .filter(c => c !== cat)
          .filter(c => !implied.includes(c) || otherImplied.includes(c))
      } else {
        const implied = IMPLIED_CATEGORIES[cat] || []
        return [...new Set([...prev, cat, ...implied])]
      }
    })
  }

  function isCategoryImplied(cat: string): boolean {
    return Object.entries(IMPLIED_CATEGORIES).some(
      ([parent, children]) => children.includes(cat) && selectedCategories.includes(parent)
    )
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.')
      setLoading(false)
      return
    }

    if (!termsAccepted) {
      setError('You must accept the Terms and Privacy Policy to continue.')
      setLoading(false)
      return
    }

    const fullName = [firstName.trim(), middleNames.trim(), lastName.trim()].filter(Boolean).join(' ')
    const validLicences = licences.map(l => l.trim()).filter(Boolean)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Session expired. Please sign in again.')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        aml_licence_number: hasLicence === 'yes' && validLicences.length > 0 ? validLicences.join(', ') : null,
        aml_categories: hasLicence === 'yes' ? selectedCategories : [],
        industry: approvals.filter(a => a.type).map(a => a.type).join(', ') || null,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (employer.trim()) {
      await supabase.from('employment_periods').insert({
        user_id: user.id,
        employer: employer.trim(),
        start_date: new Date().toISOString().split('T')[0],
      })
    }

    await supabase.auth.updateUser({ data: { full_name: fullName } })

    router.push('/profile')
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black tracking-tight">Complete your profile</h1>
          <p className="text-sm text-gray-500 mt-2">
            We need a few details to set up your profile.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-5">

          {/* Name section */}
          <div>
            <p className="text-xs font-bold text-black mb-3">Your full name</p>
            <p className="text-[11px] text-gray-400 mb-3">If you hold a Part 66 licence, this should match the name on your licence.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs text-gray-500">First name</Label>
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
                <Label htmlFor="lastName" className="text-xs text-gray-500">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
                />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <Label htmlFor="middleNames" className="text-xs text-gray-500">
                Middle name(s) <span className="text-gray-300">optional</span>
              </Label>
              <Input
                id="middleNames"
                value={middleNames}
                onChange={e => setMiddleNames(e.target.value)}
                className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Licence question */}
          <div>
            <p className="text-xs font-bold text-black mb-1">Do you hold a Part 66 Aircraft Maintenance Licence?</p>
            <p className="text-[11px] text-gray-400 mb-3">This may be issued by any competent authority (e.g. UK.66.123456A).</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setHasLicence('yes')}
                className={`flex-1 h-12 rounded-xl text-sm font-bold transition-colors ${
                  hasLicence === 'yes'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => { setHasLicence('no'); setLicences(['']); setSelectedCategories([]) }}
                className={`flex-1 h-12 rounded-xl text-sm font-bold transition-colors ${
                  hasLicence === 'no'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Licence details — only shown if user holds a licence */}
          {hasLicence === 'yes' && (
            <>
              <div>
                <p className="text-xs font-bold text-black mb-3">Licence details</p>
                <p className="text-[11px] text-gray-400 mb-3">Used to track your module exam progress and generate your continuation training record.</p>
                <div className="space-y-3">
                  {licences.map((licence, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1 space-y-1.5">
                        {index === 0 && (
                          <Label className="text-xs text-gray-500">
                            Licence number <span className="text-gray-300">optional</span>
                          </Label>
                        )}
                        <Input
                          placeholder="e.g. UK.66.12345"
                          value={licence}
                          onChange={e => updateLicence(index, e.target.value)}
                          className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
                        />
                      </div>
                      {licences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLicence(index)}
                          className="self-end h-12 px-3 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLicence}
                    className="text-xs font-bold text-black hover:underline"
                  >
                    + Add another licence
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-black mb-1">Licence categories</p>
                <p className="text-[11px] text-gray-400 mb-3">Select your current or target categories. This determines which modules appear in your tracker.</p>
                <div className="flex flex-wrap gap-2">
                  {AML_CATEGORIES.map(cat => {
                    const isSelected = selectedCategories.includes(cat.value)
                    const isImplied = isCategoryImplied(cat.value)
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => !isImplied && toggleCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                          isSelected
                            ? isImplied
                              ? 'bg-gray-700 text-white cursor-default'
                              : 'bg-black text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isImplied ? `Automatically included with ${Object.entries(IMPLIED_CATEGORIES).find(([, v]) => v.includes(cat.value))?.[0]}` : cat.label}
                      >
                        {cat.value}
                      </button>
                    )
                  })}
                </div>
                {selectedCategories.some(c => Object.values(IMPLIED_CATEGORIES).flat().includes(c)) && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    Grey categories are automatically included with your selected B1 category.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Unlicensed context */}
          {hasLicence === 'no' && (
            <p className="text-[11px] text-gray-400 bg-gray-50 rounded-xl p-3">
              No problem. You can still use the digital logbook, continuation training tracker, and all other tools. You can add licence details later from your profile if you obtain one.
            </p>
          )}

          <div className="h-px bg-gray-100" />

          {/* Organisation section */}
          <div>
            <p className="text-xs font-bold text-black mb-3">Organisation</p>
            <p className="text-[11px] text-gray-400 mb-3">The organisation you currently work for. This appears on your logbook entries and training records.</p>
            <div className="space-y-1.5">
              <Label htmlFor="employer" className="text-xs text-gray-500">
                Organisation <span className="text-gray-300">optional</span>
              </Label>
              <Input
                id="employer"
                placeholder="e.g. British Airways Engineering"
                value={employer}
                onChange={e => setEmployer(e.target.value)}
                className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>
          </div>

          {/* Approvals — repeatable */}
          <div>
            <p className="text-xs font-bold text-black mb-1">Organisation approval</p>
            <p className="text-[11px] text-gray-400 mb-3">The type of approval and reference number held by your organisation.</p>
            <div className="space-y-3">
              {approvals.map((approval, index) => (
                <div key={index} className="space-y-2">
                  {index > 0 && <div className="h-px bg-gray-50 mt-1" />}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      {index === 0 && <Label className="text-xs text-gray-500 mb-1.5 block">Approval type <span className="text-gray-300">optional</span></Label>}
                      <select
                        value={approval.type}
                        onChange={e => updateApproval(index, 'type', e.target.value)}
                        className="w-full h-12 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-black focus:ring-black focus:outline-none"
                      >
                        <option value="">Select approval type</option>
                        {APPROVAL_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    {approvals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeApproval(index)}
                        className="self-end h-12 px-3 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div>
                    {index === 0 && <Label className="text-xs text-gray-500 mb-1.5 block">Approval reference <span className="text-gray-300">optional</span></Label>}
                    <Input
                      placeholder="e.g. UK.145.0000"
                      value={approval.reference}
                      onChange={e => updateApproval(index, 'reference', e.target.value)}
                      className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addApproval}
                className="text-xs font-bold text-black hover:underline"
              >
                + Add another approval
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Consent checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-xs text-gray-500">
                I agree to the <Link href="/terms" className="text-black font-bold hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-black font-bold hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={e => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-xs text-gray-500">
                Keep me updated with product news, regulatory changes, and training resources. You can unsubscribe at any time.
              </span>
            </label>
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

          <p className="text-[11px] text-gray-300 text-center leading-relaxed">
            You can update these details at any time from your profile settings.
          </p>
        </form>
      </div>
    </div>
  )
}

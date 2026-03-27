'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AML_CATEGORIES } from '@/lib/profile/constants'
import { UK_TYPE_RATINGS } from '@/lib/profile/type-ratings'

interface ProfileEditorProps {
  profile: {
    aml_licence_number: string
    aml_categories: string[]
    type_ratings: string[]
  }
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [licenceNumber, setLicenceNumber] = useState(profile.aml_licence_number)
  const [categories, setCategories] = useState<string[]>(profile.aml_categories)
  const [typeRatings, setTypeRatings] = useState<string[]>(profile.type_ratings)
  const [typeSearch, setTypeSearch] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Filter type ratings based on selected categories and search term
  const filteredRatings = useMemo(() => {
    if (!typeSearch.trim()) return []
    const query = typeSearch.toLowerCase()
    return UK_TYPE_RATINGS
      .filter(r => {
        const matchesCategory = categories.length === 0 || categories.includes(r.category)
        const matchesSearch =
          r.rating.toLowerCase().includes(query) ||
          r.make.toLowerCase().includes(query) ||
          r.model.toLowerCase().includes(query)
        return matchesCategory && matchesSearch
      })
      .slice(0, 20)
  }, [typeSearch, categories])

  function toggleCategory(value: string) {
    setCategories(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    )
    setSaved(false)
  }

  function addTypeRating(rating: string) {
    if (!typeRatings.includes(rating)) {
      setTypeRatings(prev => [...prev, rating])
      setSaved(false)
    }
    setTypeSearch('')
  }

  function removeTypeRating(rating: string) {
    setTypeRatings(prev => prev.filter(t => t !== rating))
    setSaved(false)
  }

  function formatLicenceNumber(value: string): string {
    // Auto-format to UK.66.XXXXXXX pattern
    const digits = value.replace(/[^0-9]/g, '')
    if (digits.length === 0 && !value.startsWith('UK')) return value
    if (digits.length <= 7) {
      return `UK.66.${digits.padEnd(7, '').trim()}`
    }
    return `UK.66.${digits.slice(0, 7)}`
  }

  function handleLicenceChange(value: string) {
    // Allow free typing but enforce format on blur
    setLicenceNumber(value)
    setSaved(false)
  }

  function handleLicenceBlur() {
    if (licenceNumber && licenceNumber !== 'UK.66.') {
      const digits = licenceNumber.replace(/[^0-9]/g, '')
      if (digits.length > 0) {
        setLicenceNumber(`UK.66.${digits.slice(0, 7)}`)
      }
    }
  }

  async function handleSave() {
    setError('')
    setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        aml_licence_number: licenceNumber || null,
        aml_categories: categories,
        type_ratings: typeRatings,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Failed to save. Please try again.')
      return
    }

    setSaved(true)
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Licence Number */}
      <div>
        <Label htmlFor="licence-number">
          UK CAA Licence Number
        </Label>
        <Input
          id="licence-number"
          value={licenceNumber}
          onChange={e => handleLicenceChange(e.target.value)}
          onBlur={handleLicenceBlur}
          placeholder="UK.66.1234567"
          className="mt-1.5 max-w-xs"
        />
        <p className="text-xs text-gray-400 mt-1">Format: UK.66.XXXXXXX (7 digits)</p>
      </div>

      {/* AML Categories */}
      <div>
        <Label>
          Licence Categories Held
        </Label>
        <p className="text-xs text-gray-400 mt-0.5 mb-2">Select all that apply to your Aircraft Maintenance Licence.</p>
        <div className="flex flex-wrap gap-2">
          {AML_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggleCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                categories.includes(cat.value)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cat.value}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {categories.map(c => AML_CATEGORIES.find(a => a.value === c)?.label).join(', ')}
          </div>
        )}
      </div>

      {/* Type Ratings */}
      <div>
        <Label>
          Aircraft Type Ratings
        </Label>
        <p className="text-xs text-gray-400 mt-0.5 mb-2">
          Search and select from the UK CAA approved type rating list.
          {categories.length > 0 && ` Filtered to: ${categories.join(', ')}.`}
        </p>

        {/* Selected ratings */}
        {typeRatings.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {typeRatings.map(rating => (
              <Badge key={rating} variant="secondary" className="gap-1 pr-1">
                {rating}
                <button
                  type="button"
                  onClick={() => removeTypeRating(rating)}
                  className="ml-1 px-1 rounded hover:bg-gray-300 text-gray-500 hover:text-gray-700"
                >
                  x
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Input
            value={typeSearch}
            onChange={e => setTypeSearch(e.target.value)}
            placeholder="Search by aircraft name, make, or model..."
            className="max-w-md"
          />
          {filteredRatings.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-w-md bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredRatings.map(r => (
                <button
                  key={`${r.category}-${r.rating}`}
                  type="button"
                  onClick={() => addTypeRating(r.rating)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0 ${
                    typeRatings.includes(r.rating) ? 'bg-gray-50 text-gray-400' : ''
                  }`}
                  disabled={typeRatings.includes(r.rating)}
                >
                  <span className="font-medium">{r.rating}</span>
                  <span className="text-gray-400 ml-2">{r.category} · {r.group}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved successfully</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}

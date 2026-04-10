'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const COUNTRY_NAMES: Record<string, string> = {
  AE: 'United Arab Emirates', AT: 'Austria', AU: 'Australia', BE: 'Belgium', BG: 'Bulgaria',
  BH: 'Bahrain', BR: 'Brazil', CA: 'Canada', CH: 'Switzerland', CN: 'China',
  CR: 'Costa Rica', CY: 'Cyprus', CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark',
  EE: 'Estonia', ES: 'Spain', FI: 'Finland', FR: 'France', GB: 'United Kingdom',
  GR: 'Greece', HK: 'Hong Kong', HR: 'Croatia', HU: 'Hungary', ID: 'Indonesia',
  IE: 'Ireland', IL: 'Israel', IN: 'India', IS: 'Iceland', IT: 'Italy',
  JO: 'Jordan', JP: 'Japan', KR: 'South Korea', KW: 'Kuwait', LT: 'Lithuania',
  LU: 'Luxembourg', LV: 'Latvia', MA: 'Morocco', MT: 'Malta', MU: 'Mauritius',
  MX: 'Mexico', MY: 'Malaysia', NL: 'Netherlands', NO: 'Norway', NZ: 'New Zealand',
  OM: 'Oman', PE: 'Peru', PH: 'Philippines', PK: 'Pakistan', PL: 'Poland',
  PT: 'Portugal', QA: 'Qatar', RO: 'Romania', RS: 'Serbia', SA: 'Saudi Arabia',
  SE: 'Sweden', SG: 'Singapore', SI: 'Slovenia', SK: 'Slovakia', TH: 'Thailand',
  TR: 'Turkey', TW: 'Taiwan', UA: 'Ukraine', US: 'United States', ZA: 'South Africa',
}

type Approval = {
  id: number
  reference_number: string
  organisation_name: string
  status: string
  city: string | null
  country_code: string
  website: string | null
}

export function MarketTable({ approvals }: { approvals: Approval[] }) {
  const [nameFilter, setNameFilter] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')

  const uniqueCountries = useMemo(() => {
    const codes = [...new Set(approvals.map(a => a.country_code))].filter(c => c && /^[A-Z]{2}$/.test(c))
    return codes.sort((a, b) => (COUNTRY_NAMES[a] || a).localeCompare(COUNTRY_NAMES[b] || b))
  }, [approvals])

  const filtered = useMemo(() => {
    const nameLower = nameFilter.toLowerCase()
    const approvalLower = approvalFilter.toLowerCase()

    return approvals.filter(org => {
      if (nameLower && !org.organisation_name.toLowerCase().includes(nameLower)) return false
      if (approvalLower && !org.reference_number.toLowerCase().includes(approvalLower)) return false
      if (countryFilter && org.country_code !== countryFilter) return false
      return true
    })
  }, [approvals, nameFilter, approvalFilter, countryFilter])

  const hasFilters = nameFilter || approvalFilter || countryFilter

  return (
    <>
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 pt-3 pb-1">Organisation</th>
                <th className="text-left font-medium text-muted-foreground px-4 pt-3 pb-1 hidden sm:table-cell">Approval(s)</th>
                <th className="text-left font-medium text-muted-foreground px-4 pt-3 pb-1 hidden md:table-cell">Location</th>
              </tr>
              <tr className="border-b bg-muted/50">
                <th className="px-4 pt-1 pb-3">
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    placeholder="Filter..."
                    className="w-full h-7 rounded border border-input bg-background px-2 text-xs font-normal text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </th>
                <th className="px-4 pt-1 pb-3 hidden sm:table-cell">
                  <input
                    type="text"
                    value={approvalFilter}
                    onChange={e => setApprovalFilter(e.target.value)}
                    placeholder="Filter..."
                    className="w-full h-7 rounded border border-input bg-background px-2 text-xs font-normal text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </th>
                <th className="px-4 pt-1 pb-3 hidden md:table-cell">
                  <select
                    value={countryFilter}
                    onChange={e => setCountryFilter(e.target.value)}
                    className="w-full h-7 rounded border border-input bg-background px-2 text-xs font-normal text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">All countries</option>
                    {uniqueCountries.map(c => (
                      <option key={c} value={c}>{COUNTRY_NAMES[c] || c}</option>
                    ))}
                  </select>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(org => (
                <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/market/${encodeURIComponent(org.reference_number)}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {org.organisation_name}
                    </Link>
                    <span className="sm:hidden block text-xs text-muted-foreground mt-0.5">
                      {org.reference_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {org.reference_number}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {COUNTRY_NAMES[org.country_code] || org.country_code || '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No organisations found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {hasFilters
          ? `${filtered.length.toLocaleString()} of ${approvals.length.toLocaleString()} organisations`
          : `${approvals.length.toLocaleString()} organisations`
        }
      </p>
    </>
  )
}

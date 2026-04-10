import type { Metadata } from 'next'
import { getDb } from '@/lib/postgres/server'
import { MarketTable } from '@/components/market-table'

export const metadata: Metadata = {
  title: 'The Market | Airworthiness',
  description: 'Search 1,500+ UK CAA Part 145 approved maintenance organisations. Filter by country, rating class, and capabilities.',
}

export default async function MarketPage() {
  const db = getDb()

  const { rows: approvals } = await db.query(`
    SELECT
      a.id,
      a.reference_number,
      a.organisation_name,
      a.status,
      a.city,
      a.state,
      a.country_code,
      a.website,
      a.issued_date,
      COALESCE(
        json_agg(
          json_build_object(
            'id', r.id,
            'rating_class', r.rating_class,
            'category', r.category,
            'detail', r.detail,
            'base_maintenance', r.base_maintenance,
            'line_maintenance', r.line_maintenance
          )
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) AS part145_ratings
    FROM part145_approvals a
    LEFT JOIN part145_ratings r ON r.approval_id = a.id
    GROUP BY a.id
    ORDER BY a.organisation_name
  `)

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            The Market
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            The Market by Airworthiness brings together those with something to sell and those looking to buy. We have developed the largest platform of airworthiness organisations approved to trade in the aviation market. Whether you need new floor panels, a hydraulic pump overhaul, a type training course, or support managing a maintenance programme, we can connect you with the right provider.
          </p>

          <div className="mt-8">
            <MarketTable approvals={approvals} />
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Data sourced from the UK Civil Aviation Authority Part 145 approved organisation register.
          </p>
        </div>
      </section>
    </div>
  )
}

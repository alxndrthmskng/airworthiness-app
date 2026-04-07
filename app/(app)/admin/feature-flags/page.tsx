import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FeatureFlagToggle } from './feature-flag-toggle'

export const metadata: Metadata = { title: 'Feature Flags | Airworthiness Admin' }

export default async function FeatureFlagsPage() {
  const supabase = await createClient()

  const { data: flags } = await supabase
    .from('feature_flags')
    .select('key, enabled, description, updated_at, updated_by')
    .order('key')

  const { data: recentAudit } = await supabase
    .from('feature_flag_audit')
    .select('id, flag_key, previous_value, new_value, changed_at, changed_by')
    .order('changed_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Feature Flags</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kill switches for platform features. Changes take effect within 60 seconds across all servers.
          Every change is recorded in the audit log below.
        </p>
      </div>

      <div className="space-y-3">
        {flags?.map(flag => (
          <FeatureFlagToggle
            key={flag.key}
            flagKey={flag.key}
            initialEnabled={flag.enabled}
            description={flag.description ?? ''}
          />
        ))}
      </div>

      {recentAudit && recentAudit.length > 0 && (
        <div className="mt-12">
          <h2 className="text-base font-semibold text-foreground mb-3">Recent changes</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Flag</th>
                  <th className="text-left px-4 py-2">Change</th>
                  <th className="text-left px-4 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {recentAudit.map(entry => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs">{entry.flag_key}</td>
                    <td className="px-4 py-2">
                      {entry.previous_value === null
                        ? <span className="text-muted-foreground">created → {String(entry.new_value)}</span>
                        : <span>{String(entry.previous_value)} → {String(entry.new_value)}</span>}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {new Date(entry.changed_at).toLocaleString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export type PrivacyEventCategory =
  | 'consent'
  | 'profile'
  | 'social'
  | 'data_export'
  | 'data_deletion'
  | 'authentication'

export interface LogPrivacyEventParams {
  eventType: string
  eventCategory: PrivacyEventCategory
  metadata?: Record<string, unknown>
}

export async function logPrivacyEvent(params: LogPrivacyEventParams): Promise<string | null> {
  try {
    const h = await headers()
    const ipAddress = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null
    const userAgent = h.get('user-agent') ?? null

    const session = await auth()

    const row = await queryOne<{ id: string }>(
      `SELECT log_privacy_event($1, $2, $3, $4, $5) AS id`,
      [
        params.eventType,
        params.eventCategory,
        JSON.stringify(params.metadata ?? {}),
        ipAddress,
        userAgent,
      ],
    )

    return row?.id ?? null
  } catch (err) {
    console.error('[privacy-audit] Failed to log event:', params.eventType, err)
    return null
  }
}

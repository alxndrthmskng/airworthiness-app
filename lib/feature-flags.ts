import { queryOne, queryAll } from '@/lib/db'

/**
 * Feature flag system — kill switch for the platform.
 *
 * Flags live in the `feature_flags` table. Reads are cached
 * in memory for 60 seconds to reduce database load. Writes invalidate
 * the cache via the `clearFeatureFlagCache` function (called from the
 * admin route on flag toggle).
 *
 * Default behaviour for unknown flags is `false` — fail closed.
 */

type CacheEntry = { value: boolean; expires: number }

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.value
  }

  try {
    const row = await queryOne<{ enabled: boolean }>(
      'SELECT enabled FROM feature_flags WHERE key = $1',
      [key],
    )

    const value = row?.enabled ?? false
    cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS })
    return value
  } catch (err) {
    console.error(`[feature-flags] Error reading flag ${key}:`, err)
    return false
  }
}

export async function getFeatureFlags(keys: string[]): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {}
  const uncached: string[] = []

  for (const key of keys) {
    const cached = cache.get(key)
    if (cached && cached.expires > Date.now()) {
      result[key] = cached.value
    } else {
      uncached.push(key)
    }
  }

  if (uncached.length === 0) return result

  try {
    const rows = await queryAll<{ key: string; enabled: boolean }>(
      'SELECT key, enabled FROM feature_flags WHERE key = ANY($1)',
      [uncached],
    )

    const expires = Date.now() + CACHE_TTL_MS
    const fetched = new Map(rows.map(row => [row.key, row.enabled]))

    for (const key of uncached) {
      const value = fetched.get(key) ?? false
      result[key] = value
      cache.set(key, { value, expires })
    }
  } catch (err) {
    console.error('[feature-flags] Error reading flags:', err)
    for (const key of uncached) result[key] = false
  }

  return result
}

export function clearFeatureFlagCache(key?: string) {
  if (key) {
    cache.delete(key)
    allowlistCache.delete(key)
  } else {
    cache.clear()
    allowlistCache.clear()
  }
}

type AllowlistEntry = { userIds: Set<string>; expires: number }
const allowlistCache = new Map<string, AllowlistEntry>()

async function getAllowlist(key: string): Promise<Set<string>> {
  const cached = allowlistCache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.userIds
  }

  try {
    const rows = await queryAll<{ user_id: string }>(
      'SELECT user_id FROM feature_flag_allowlist WHERE flag_key = $1',
      [key],
    )

    const userIds = new Set(rows.map(row => row.user_id))
    allowlistCache.set(key, { userIds, expires: Date.now() + CACHE_TTL_MS })
    return userIds
  } catch (err) {
    console.error(`[feature-flags] Error reading allowlist for ${key}:`, err)
    return new Set()
  }
}

export async function isFeatureEnabledForUser(key: string, userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false

  const flagOn = await isFeatureEnabled(key)
  if (!flagOn) return false

  const allowlist = await getAllowlist(key)
  if (allowlist.size === 0) return true
  return allowlist.has(userId)
}

export async function isAdmin(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false
  try {
    const row = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM admins WHERE user_id = $1',
      [userId],
    )
    return !!row
  } catch {
    return false
  }
}

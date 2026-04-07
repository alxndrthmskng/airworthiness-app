import { createClient } from '@/lib/supabase/server'

/**
 * Feature flag system — kill switch for the platform.
 *
 * Flags live in the `feature_flags` Supabase table. Reads are cached
 * in memory for 60 seconds to reduce database load. Writes invalidate
 * the cache via the `clearFeatureFlagCache` function (called from the
 * admin route on flag toggle).
 *
 * Default behaviour for unknown flags is `false` — fail closed. If a
 * feature is gated on a flag and the flag is missing, the feature is
 * disabled. This is the safe default for incident response: if anything
 * goes wrong with the flag system itself, features are off.
 */

type CacheEntry = { value: boolean; expires: number }

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000 // 60 seconds

/**
 * Check whether a feature flag is enabled. Cached for 60 seconds.
 *
 * @param key The flag key, e.g. `social_profile`
 * @returns true if the flag is enabled, false otherwise (including missing or errored)
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.value
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .maybeSingle()

    if (error) {
      // Fail closed: if we can't reach the flag table, treat the feature as disabled
      console.error(`[feature-flags] Error reading flag ${key}:`, error.message)
      return false
    }

    const value = data?.enabled ?? false
    cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS })
    return value
  } catch (err) {
    console.error(`[feature-flags] Unexpected error reading flag ${key}:`, err)
    return false
  }
}

/**
 * Read multiple flags at once. More efficient than calling
 * `isFeatureEnabled` repeatedly when you need several flags on a page.
 */
export async function getFeatureFlags(keys: string[]): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {}
  const uncached: string[] = []

  // Check cache first
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
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, enabled')
      .in('key', uncached)

    if (error) {
      console.error('[feature-flags] Error reading flags:', error.message)
      // Fail closed for all uncached keys
      for (const key of uncached) result[key] = false
      return result
    }

    const expires = Date.now() + CACHE_TTL_MS
    const fetched = new Map((data ?? []).map(row => [row.key, row.enabled]))

    for (const key of uncached) {
      const value = fetched.get(key) ?? false
      result[key] = value
      cache.set(key, { value, expires })
    }
  } catch (err) {
    console.error('[feature-flags] Unexpected error reading flags:', err)
    for (const key of uncached) result[key] = false
  }

  return result
}

/**
 * Clear the in-memory cache. Called by the admin route after toggling a flag,
 * so the change takes effect within the current Node process immediately
 * (rather than waiting up to 60 seconds for the cache to expire).
 *
 * Note: in serverless environments with multiple instances, each instance
 * has its own cache. The 60-second TTL caps the propagation delay for
 * instances that did not handle the toggle.
 */
export function clearFeatureFlagCache(key?: string) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

/**
 * Check if a user is an admin. Used to gate the feature flag admin UI.
 */
export async function isAdmin(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) return false
    return !!data
  } catch {
    return false
  }
}

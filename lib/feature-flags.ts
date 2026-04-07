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
    allowlistCache.delete(key)
  } else {
    cache.clear()
    allowlistCache.clear()
  }
}

/**
 * Per-flag allowlist cache. When a flag has any allowlist entries, only
 * users in the allowlist see the feature (soft launch mode). Cached for
 * the same 60s TTL as the flag itself.
 */
type AllowlistEntry = { userIds: Set<string>; expires: number }
const allowlistCache = new Map<string, AllowlistEntry>()

async function getAllowlist(key: string): Promise<Set<string>> {
  const cached = allowlistCache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.userIds
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('feature_flag_allowlist')
      .select('user_id')
      .eq('flag_key', key)

    if (error) {
      console.error(`[feature-flags] Error reading allowlist for ${key}:`, error.message)
      return new Set()
    }

    const userIds = new Set((data ?? []).map(row => row.user_id as string))
    allowlistCache.set(key, { userIds, expires: Date.now() + CACHE_TTL_MS })
    return userIds
  } catch (err) {
    console.error(`[feature-flags] Unexpected error reading allowlist for ${key}:`, err)
    return new Set()
  }
}

/**
 * Check whether a feature flag is enabled for a specific user.
 *
 * Semantics:
 * - flag disabled        → false (kill switch always wins)
 * - flag enabled, no allowlist → true for all users (full launch)
 * - flag enabled, allowlist set → true only if user is in the allowlist (soft launch)
 *
 * Pass the userId from the authenticated session. For pages that don't
 * require user identity (like public profile pages), use the regular
 * isFeatureEnabled() instead, which only checks the global flag state.
 */
export async function isFeatureEnabledForUser(key: string, userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false

  const flagOn = await isFeatureEnabled(key)
  if (!flagOn) return false

  const allowlist = await getAllowlist(key)
  // Empty allowlist = full launch (everyone sees it)
  if (allowlist.size === 0) return true
  // Soft launch: user must be in the allowlist
  return allowlist.has(userId)
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

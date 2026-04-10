/**
 * Thin storage helper that talks to the Supabase Storage REST API directly,
 * bypassing the JS SDK. This lets us drop @supabase/supabase-js while keeping
 * storage working until a self-hosted alternative is set up.
 */

const STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`
const STORAGE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Build a public URL for a file in a public bucket */
export function getPublicUrl(bucket: string, path: string): string {
  return `${STORAGE_URL}/object/public/${bucket}/${path}`
}

/** Upload a file (server-side only — uses service role key) */
export async function uploadFile(
  bucket: string,
  path: string,
  body: BodyInit,
  contentType: string,
  opts?: { upsert?: boolean },
): Promise<{ error: string | null }> {
  const res = await fetch(`${STORAGE_URL}/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STORAGE_KEY}`,
      'Content-Type': contentType,
      ...(opts?.upsert ? { 'x-upsert': 'true' } : {}),
    },
    body,
  })
  if (!res.ok) return { error: await res.text() }
  return { error: null }
}

/** Remove files from a bucket (server-side only) */
export async function removeFiles(bucket: string, paths: string[]): Promise<void> {
  await fetch(`${STORAGE_URL}/object/${bucket}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${STORAGE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: paths }),
  })
}

/** Create a time-limited signed URL for a private file */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number,
): Promise<string | null> {
  const res = await fetch(`${STORAGE_URL}/object/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STORAGE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return `${STORAGE_URL}${data.signedURL}`
}

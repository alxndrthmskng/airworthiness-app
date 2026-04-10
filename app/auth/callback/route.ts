import { redirect } from 'next/navigation'

/**
 * Legacy Supabase auth callback route.
 * Auth.js handles callbacks at /api/auth/callback/email automatically.
 * This route now just redirects to the complete-profile page.
 */
export async function GET() {
  redirect('/complete-profile')
}

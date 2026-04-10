import { auth } from '@/lib/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()

  if (
    !session?.user &&
    (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/logbook') ||
      request.nextUrl.pathname.startsWith('/account') ||
      request.nextUrl.pathname.startsWith('/modules') ||
      request.nextUrl.pathname.startsWith('/training') ||
      request.nextUrl.pathname.startsWith('/complete-profile') ||
      request.nextUrl.pathname.startsWith('/settings'))
  ) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (
    session?.user &&
    request.nextUrl.pathname.startsWith('/login')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/logbook/:path*',
    '/account/:path*',
    '/modules/:path*',
    '/training/:path*',
    '/settings/:path*',
    '/complete-profile',
    '/login',
  ],
}

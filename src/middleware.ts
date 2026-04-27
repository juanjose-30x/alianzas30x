import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession, isSuperAdmin, COOKIE_NAME } from '@/lib/session'

// Routes that bypass auth entirely (external-facing)
const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/api/auth',
  '/_next',
  '/favicon',
]

// Patterns for externally accessible pages (gerentes)
const PUBLIC_PATTERNS = [
  /^\/[^/]+\/diagnostico/,
  /^\/[^/]+\/propuesta/,
  /^\/d\//,
  /^\/api\/b2b\/diagnostico\//,
  /^\/api\/b2b\/propuesta\//,
  /^\/api\/b2b\/leads\/[^/]+\/submission-chat/,
]

// Superadmin-only prefixes
const SUPERADMIN_PREFIXES = [
  '/pipeline/prospecting',
  '/api/b2b/prospecting',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATH_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (PUBLIC_PATTERNS.some(p => p.test(pathname))) return NextResponse.next()

  // Verify session
  const token = request.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Superadmin-only guard
  if (SUPERADMIN_PREFIXES.some(p => pathname.startsWith(p))) {
    if (!isSuperAdmin(session.email)) {
      return NextResponse.redirect(new URL('/pipeline', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/pipeline/:path*',
    '/api/b2b/leads/:path*',
    '/api/b2b/events/:path*',
    '/api/b2b/grain/:path*',
    '/api/b2b/scrape/:path*',
    '/api/b2b/outreach/:path*',
    '/api/b2b/prospecting/:path*',
  ],
}

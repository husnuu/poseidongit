import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/adminSession'

/** Eski / kaldırılmış sayfalar — 410 Gone (arama motorları indeksten çıkarır). */
const gonePaths = new Set([
  '/services',
  '/program',
  '/home',
  '/about',
  '/admission',
  '/contact-2',
  '/category/uncategorized',
])

/**
 * Canonical host: www vs non-www
 * 301 redirect so all traffic and PageRank go to one URL.
 *
 * Default: non-www canonical (www.example.com → example.com).
 * Set NEXT_PUBLIC_CANONICAL_PREFER_WWW=true to use www as canonical.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.nextUrl.hostname
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'

  if (gonePaths.has(pathname) || pathname.startsWith('/category/')) {
    return new NextResponse('Gone', { status: 410 })
  }

  const preferWww =
    process.env.NEXT_PUBLIC_CANONICAL_PREFER_WWW === 'true' ||
    process.env.NEXT_PUBLIC_CANONICAL_PREFER_WWW === '1'

  if (!isLocal) {
    const hasWww = hostname.startsWith('www.')
    if (preferWww && !hasWww) {
      const url = request.nextUrl.clone()
      url.hostname = `www.${hostname}`
      return NextResponse.redirect(url, 301)
    }
    if (!preferWww && hasWww) {
      const url = request.nextUrl.clone()
      url.hostname = hostname.slice(4)
      return NextResponse.redirect(url, 301)
    }
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const secret = process.env.ADMIN_JWT_SECRET?.trim()
    if (!secret || secret.length < 24) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'config')
      return NextResponse.redirect(url)
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    let ok = false
    if (token) {
      try {
        const p = await verifyAdminSessionToken(token)
        ok = !!(p?.sub && p.email)
      } catch {
        ok = false
      }
    }
    if (!ok) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?)$).*)',
  ],
}

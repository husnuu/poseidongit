import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (gonePaths.has(pathname) || pathname.startsWith('/category/')) {
    return new NextResponse('Gone', { status: 410 })
  }

  const hostname = request.nextUrl.hostname
  const preferWww =
    process.env.NEXT_PUBLIC_CANONICAL_PREFER_WWW === 'true' ||
    process.env.NEXT_PUBLIC_CANONICAL_PREFER_WWW === '1'

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return NextResponse.next()
  }

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

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?)$).*)',
  ],
}

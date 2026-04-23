import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/adminSessionConstants'
import { verifyAdminSessionTokenEdge } from '@/lib/adminJwtVerifyEdge'
import { parseLocaleFromPathname } from '@/lib/i18n/paths'
import { isSiteLocale } from '@/lib/i18n/config'
import { incomingPathToCanonicalRoute } from '@/lib/i18n/routeAliases'

/** Eski / kaldırılmış sayfalar — 410 Gone (arama motorları indeksten çıkarır). */
const gonePaths = new Set([
  '/services',
  '/program',
  '/home',
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

  const skipLocaleRewrite =
    pathname.startsWith('/api') ||
    pathname.startsWith('/odeme') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/studio') ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/llms.txt' ||
    pathname.startsWith('/ingest') ||
    /\.[a-zA-Z0-9]+$/.test(pathname.split('/').pop() ?? '')

  if (!skipLocaleRewrite) {
    const { locale, pathWithoutLocale } = parseLocaleFromPathname(pathname)
    if (!isSiteLocale(locale)) {
      return new NextResponse(null, { status: 404 })
    }
    // TR: canonical tour detail URLs use /tur/; 301 from legacy /tour/
    if (
      locale === 'tr' &&
      (pathWithoutLocale === '/tour' || pathWithoutLocale.startsWith('/tour/'))
    ) {
      const suffix =
        pathWithoutLocale === '/tour' ? '' : pathWithoutLocale.slice('/tour'.length)
      const newPathWithoutLocale = `/tur${suffix}`
      const url = request.nextUrl.clone()
      if (pathname.startsWith('/tr/') || pathname === '/tr') {
        url.pathname = `/tr${newPathWithoutLocale}`
      } else {
        url.pathname = newPathWithoutLocale
      }
      return NextResponse.redirect(url, 301)
    }
    const canonicalPath = incomingPathToCanonicalRoute(locale, pathWithoutLocale)
    const internalPath = `/${locale}${canonicalPath === '/' ? '' : canonicalPath}`
    if (internalPath === pathname) {
      const res = NextResponse.next()
      res.headers.set('x-site-locale', locale)
      return res
    }
    // clone + pathname: `new URL(internalPath, request.url)` strips ?query (bilet ?token= kaybolur)
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = internalPath
    const res = NextResponse.rewrite(rewriteUrl)
    res.headers.set('x-site-locale', locale)
    return res
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
        const p = await verifyAdminSessionTokenEdge(token, secret)
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

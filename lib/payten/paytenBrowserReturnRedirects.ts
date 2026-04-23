import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { parsePaytenPostToRecord } from '@/lib/payten/parsePaytenPostBody'
import {
  extractPaytenOrderLookupTokenFromPostRecord,
  isSafePaytenOrderLookupToken,
} from '@/lib/payten/paytenOrderToken'
import { getBaseUrl } from '@/lib/seo'
import { emitPaytenReturnDiagnostics } from '@/lib/services/paymentService'

/** Banka POST → GET: tarayıcı tekrar GET ile onay sayfasına gitsin (RFC 9110). */
const BROWSER_POST_REDIRECT = 303

/** Bazı proxy / banka POST senaryolarında `request.url` veya `nextUrl` eksik olabilir. */
function absoluteOrigin(request: Request): string {
  try {
    const u = new URL(request.url)
    if (u.origin && u.origin !== 'null') return u.origin
  } catch {
    /* request.url geçersiz */
  }
  const nx = (request as NextRequest).nextUrl
  if (nx?.origin && nx.origin !== 'null') return nx.origin

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = (request.headers.get('x-forwarded-proto') ?? 'https').split(',')[0]?.trim() ?? 'https'
  if (host) {
    try {
      const h = host.split(',')[0]?.trim()
      if (h) return new URL(`${proto}://${h}`).origin
    } catch {
      /* ignore */
    }
  }

  try {
    return new URL(getBaseUrl()).origin
  } catch {
    return 'http://localhost:3000'
  }
}

function siteUrl(pathname: string, request: Request): URL {
  return new URL(pathname.startsWith('/') ? pathname : `/${pathname}`, absoluteOrigin(request))
}

function applySafeBookingQuery(dest: URL, record: Record<string, string> | null) {
  if (!record) return
  const token = extractPaytenOrderLookupTokenFromPostRecord(record)
  if (token && isSafePaytenOrderLookupToken(token)) {
    dest.searchParams.set('bookingId', token)
  }
}

export function paytenBrowserReturnOkGET(request: NextRequest): NextResponse {
  const dest = siteUrl('/rezervasyon/onaylandi', request)
  return NextResponse.redirect(dest, 302)
}

export async function paytenBrowserReturnOkPOST(
  request: NextRequest,
  routeLabel: string
): Promise<NextResponse> {
  console.error(`[payten][${routeLabel}] okUrl tarayıcı dönüşü — banka formu bu adrese POST ediyor.`)
  const record = await parsePaytenPostToRecord(request)
  if (record) {
    emitPaytenReturnDiagnostics(routeLabel, record)
  } else {
    console.error(`[payten][${routeLabel}] POST gövdesi okunamadı (Content-Type / boş gövde).`)
  }

  const dest = siteUrl('/rezervasyon/onaylandi', request)
  applySafeBookingQuery(dest, record)
  return NextResponse.redirect(dest, BROWSER_POST_REDIRECT)
}

export function paytenBrowserReturnFailGET(request: NextRequest): NextResponse {
  const dest = siteUrl('/rezervasyon/basarisiz', request)
  return NextResponse.redirect(dest, 302)
}

export async function paytenBrowserReturnFailPOST(
  request: NextRequest,
  routeLabel: string
): Promise<NextResponse> {
  console.error(`[payten][${routeLabel}] failUrl tarayıcı dönüşü — banka formu bu adrese POST ediyor.`)
  const record = await parsePaytenPostToRecord(request)
  if (record) {
    emitPaytenReturnDiagnostics(routeLabel, record)
  } else {
    console.error(`[payten][${routeLabel}] POST gövdesi okunamadı (Content-Type / boş gövde).`)
  }

  const dest = siteUrl('/rezervasyon/basarisiz', request)
  applySafeBookingQuery(dest, record)
  return NextResponse.redirect(dest, BROWSER_POST_REDIRECT)
}

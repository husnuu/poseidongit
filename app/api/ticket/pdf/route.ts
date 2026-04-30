import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { generatePremiumEticketPdf } from '@/lib/ticket/generatePremiumEticketPdf'
import {
  premiumEticketPayloadSchema,
  premiumEticketSamplePayload,
} from '@/lib/ticket/premiumEticket'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function ticketPdfSecret(): string | undefined {
  const s = process.env.TICKET_PDF_SECRET?.trim()
  return s ? s : undefined
}

function verifyTicketPdfBearer(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get('authorization')?.trim()
  const token = auth?.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  try {
    const a = Buffer.from(token, 'utf8')
    const b = Buffer.from(secret, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Premium e-bilet PDF (Apple Wallet tarzı koyu tema).
 *
 * POST JSON gövdesi — şema: `lib/ticket/premiumEticket.ts` (`premiumEticketSamplePayload`).
 * Üretimde `TICKET_PDF_SECRET` zorunludur; `Authorization: Bearer <secret>` gerekir.
 * Geliştirmede secret yoksa Bearer istenmez (yerel test).
 *
 * GET: örnek JSON şablonu (dokümantasyon).
 */
export async function GET() {
  const secret = ticketPdfSecret()
  const prod = process.env.NODE_ENV === 'production'
  return NextResponse.json({
    description:
      'POST this JSON body to the same URL to download a premium E-Ticket PDF (dark navy / wallet style).',
    sample: premiumEticketSamplePayload,
    headers: prod || secret ? { Authorization: 'Bearer <TICKET_PDF_SECRET>' } : undefined,
    ...(prod && !secret
      ? {
          warning:
            'TICKET_PDF_SECRET is required in production; POST will return 503 until it is set.',
        }
      : {}),
  })
}

export async function POST(request: NextRequest) {
  const limited = await rateLimitResponse(request, 'ticketPdf')
  if (limited) return limited

  const secret = ticketPdfSecret()
  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      return NextResponse.json(
        { error: 'TICKET_PDF_SECRET is required in production.' },
        { status: 503 }
      )
    }
    if (!verifyTicketPdfBearer(request, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (secret && !verifyTicketPdfBearer(request, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = premiumEticketPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const pdfBytes = await generatePremiumEticketPdf(parsed.data)
    const code = parsed.data.reservationCode.replace(/[^a-zA-Z0-9._-]/g, '_')
    const brand = (process.env.NEXT_PUBLIC_SITE_NAME || 'E-Bilet').replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${brand}-E-Bilet-${code}.pdf`
    const download = request.nextUrl.searchParams.get('download') !== '0'

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('[ticket/pdf]', e)
    return NextResponse.json(
      { error: 'PDF generation failed', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { generatePremiumEticketPdf } from '@/lib/ticket/generatePremiumEticketPdf'
import {
  premiumEticketPayloadSchema,
  premiumEticketSamplePayload,
} from '@/lib/ticket/premiumEticket'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function checkSecret(request: NextRequest): boolean {
  const secret = process.env.TICKET_PDF_SECRET?.trim()
  if (!secret) return true
  const auth = request.headers.get('authorization')?.trim()
  const token = auth?.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return token === secret
}

/**
 * Premium e-bilet PDF (Apple Wallet tarzı koyu tema).
 *
 * POST JSON gövdesi — şema: `lib/ticket/premiumEticket.ts` (`premiumEticketSamplePayload`).
 * Opsiyonel: `TICKET_PDF_SECRET` tanımlıysa `Authorization: Bearer <secret>` zorunlu.
 *
 * GET: örnek JSON şablonu (dokümantasyon).
 */
export async function GET() {
  return NextResponse.json({
    description:
      'POST this JSON body to the same URL to download a premium E-Ticket PDF (dark navy / wallet style).',
    sample: premiumEticketSamplePayload,
    headers: process.env.TICKET_PDF_SECRET
      ? { Authorization: 'Bearer <TICKET_PDF_SECRET>' }
      : undefined,
  })
}

export async function POST(request: NextRequest) {
  const limited = await rateLimitResponse(request, 'ticketPdf')
  if (limited) return limited

  if (!checkSecret(request)) {
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

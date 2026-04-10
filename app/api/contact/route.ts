import { NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { sendContactFormEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function parseBody(body: unknown): {
  name?: string
  groupSize?: number
  email?: string
  phone?: string
  message?: string
  turnstileToken?: string
} | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const name = typeof b.name === 'string' ? b.name.trim() : undefined
  const groupSize =
    typeof b.groupSize === 'number'
      ? b.groupSize
      : typeof b.groupSize === 'string'
        ? parseInt(b.groupSize, 10)
        : undefined
  const email = typeof b.email === 'string' ? b.email.trim() : undefined
  const phone = typeof b.phone === 'string' ? b.phone.trim() || undefined : undefined
  const message = typeof b.message === 'string' ? b.message.trim() : undefined
  const turnstileToken = typeof b.turnstileToken === 'string' ? b.turnstileToken.trim() : undefined
  return { name, groupSize, email, phone, message, turnstileToken }
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimitResponse(request, 'publicForm')
    if (limited) return limited

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Geçersiz istek gövdesi.' },
        { status: 400 }
      )
    }

    const data = parseBody(body)
    if (!data) {
      return NextResponse.json(
        { error: 'Eksik veya geçersiz alanlar.' },
        { status: 400 }
      )
    }

    const { name, groupSize, email, message, turnstileToken } = data
    const phone = data.phone

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Ad soyad en az 2 karakter olmalıdır.' },
        { status: 400 }
      )
    }
    if (typeof groupSize !== 'number' || Number.isNaN(groupSize) || groupSize < 1) {
      return NextResponse.json(
        { error: 'Grup büyüklüğü en az 1 olmalıdır.' },
        { status: 400 }
      )
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi girin.' },
        { status: 400 }
      )
    }
    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: 'Mesaj en az 10 karakter olmalıdır.' },
        { status: 400 }
      )
    }

    const hasTurnstileSecret = Boolean(process.env.TURNSTILE_SECRET_KEY?.trim())
    if (hasTurnstileSecret && !turnstileToken) {
      return NextResponse.json(
        { error: 'Lütfen doğrulama kutusunu işaretleyin.' },
        { status: 400 }
      )
    }

    if (hasTurnstileSecret && turnstileToken) {
      const verifyResult = await verifyTurnstileToken(turnstileToken, {
      remoteip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
    })

      if (!verifyResult.success) {
        console.warn('[contact] Turnstile verify failed:', verifyResult['error-codes'])
        return NextResponse.json(
          { error: 'Doğrulama başarısız. Lütfen tekrar deneyin.' },
          { status: 400 }
        )
      }
    }

    const payload = {
      name,
      groupSize,
      email,
      ...(phone ? { phone } : {}),
      message,
    }

    const { ok, error: mailError } = await sendContactFormEmail(payload)
    if (!ok) {
      return NextResponse.json(
        { error: mailError ?? 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Mesajınız alındı.' })
  } catch (e) {
    console.error('[contact] POST error:', e)
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu.' },
      { status: 500 }
    )
  }
}

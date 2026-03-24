import { NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { sendYachtInquiryEmail } from '@/lib/email'
import { getFirestore } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

const COLLECTION = 'yachtInquiries'

function parseBody(body: unknown): {
  yachtSlug?: string
  yachtName?: string
  location?: string
  date?: string
  guestCount?: number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  message?: string
  priceFrom?: number
  currency?: string
  turnstileToken?: string
} | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const yachtSlug = typeof b.yachtSlug === 'string' ? b.yachtSlug.trim() : undefined
  const yachtName = typeof b.yachtName === 'string' ? b.yachtName.trim() : undefined
  const location = typeof b.location === 'string' ? b.location.trim() || undefined : undefined
  const date = typeof b.date === 'string' ? b.date.trim().slice(0, 10) : undefined
  const guestCount =
    typeof b.guestCount === 'number'
      ? b.guestCount
      : typeof b.guestCount === 'string'
        ? parseInt(b.guestCount, 10)
        : undefined
  const firstName = typeof b.firstName === 'string' ? b.firstName.trim() : undefined
  const lastName = typeof b.lastName === 'string' ? b.lastName.trim() : undefined
  const email = typeof b.email === 'string' ? b.email.trim() : undefined
  const phone = typeof b.phone === 'string' ? b.phone.trim() : undefined
  const message = typeof b.message === 'string' ? b.message.trim() : undefined
  const priceFrom =
    typeof b.priceFrom === 'number'
      ? b.priceFrom
      : typeof b.priceFrom === 'string'
        ? parseFloat(b.priceFrom)
        : undefined
  const currency = typeof b.currency === 'string' ? b.currency.trim() : undefined
  const turnstileToken = typeof b.turnstileToken === 'string' ? b.turnstileToken.trim() : undefined
  return {
    yachtSlug,
    yachtName,
    location,
    date,
    guestCount,
    firstName,
    lastName,
    email,
    phone,
    message,
    priceFrom: Number.isFinite(priceFrom) ? priceFrom : undefined,
    currency,
    turnstileToken,
  }
}

async function saveToFirestore(data: Record<string, unknown>) {
  try {
    const db = getFirestore()
    await db.collection(COLLECTION).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  } catch (e) {
    console.warn('[yacht-inquiry] Firestore kayıt atlandı:', e)
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
    }

    const data = parseBody(body)
    if (!data) {
      return NextResponse.json({ error: 'Geçersiz veri.' }, { status: 400 })
    }

    const {
      yachtSlug,
      yachtName,
      location,
      date,
      guestCount,
      firstName,
      lastName,
      email,
      phone,
      message,
      priceFrom,
      currency,
      turnstileToken,
    } = data

    if (!yachtSlug || !yachtName) {
      return NextResponse.json({ error: 'Yat bilgisi eksik.' }, { status: 400 })
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Geçerli bir tarih seçin.' }, { status: 400 })
    }
    if (typeof guestCount !== 'number' || Number.isNaN(guestCount) || guestCount < 1 || guestCount > 120) {
      return NextResponse.json({ error: 'Misafir sayısı geçersiz.' }, { status: 400 })
    }
    if (!firstName || firstName.length < 1) {
      return NextResponse.json({ error: 'Ad gerekli.' }, { status: 400 })
    }
    if (!lastName || lastName.length < 1) {
      return NextResponse.json({ error: 'Soyad gerekli.' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Geçerli e-posta girin.' }, { status: 400 })
    }
    if (!phone || phone.length < 7) {
      return NextResponse.json({ error: 'Geçerli telefon girin.' }, { status: 400 })
    }
    if (!message || message.length < 5) {
      return NextResponse.json({ error: 'Mesaj çok kısa.' }, { status: 400 })
    }

    const hasTurnstileSecret = Boolean(process.env.TURNSTILE_SECRET_KEY?.trim())
    if (hasTurnstileSecret && !turnstileToken) {
      return NextResponse.json({ error: 'Lütfen doğrulama kutusunu işaretleyin.' }, { status: 400 })
    }
    if (hasTurnstileSecret && turnstileToken) {
      const verifyResult = await verifyTurnstileToken(turnstileToken, {
        remoteip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      })
      if (!verifyResult.success) {
        console.warn('[yacht-inquiry] Turnstile:', verifyResult['error-codes'])
        return NextResponse.json({ error: 'Doğrulama başarısız.' }, { status: 400 })
      }
    }

    const payload = {
      yachtSlug,
      yachtName,
      ...(location ? { location } : {}),
      date,
      guestCount,
      firstName,
      lastName,
      email,
      phone,
      message,
      ...(priceFrom != null && Number.isFinite(priceFrom) ? { priceFrom } : {}),
      ...(currency ? { currency } : {}),
    }

    await saveToFirestore(payload)

    const { ok, error: mailError } = await sendYachtInquiryEmail({
      yachtName,
      yachtSlug,
      location,
      date,
      guestCount,
      firstName,
      lastName,
      email,
      phone,
      message,
      priceFrom: priceFrom != null && Number.isFinite(priceFrom) ? priceFrom : undefined,
      currency,
    })
    if (!ok) {
      return NextResponse.json(
        { error: mailError ?? 'Talep kaydedilemedi. Lütfen daha sonra tekrar deneyin.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    })
  } catch (e) {
    console.error('[yacht-inquiry] POST:', e)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}

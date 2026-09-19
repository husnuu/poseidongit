/**
 * GET /api/reports/daily-manifest
 *
 * Her sabah 09:00 (İstanbul) çalışır — o günün tüm seferlerini (sınıf bazlı
 * doluluk, yolcu listesi, özel istek, ekstralarla) adminlere e-posta olarak
 * gönderir. O gün hiç aktif rezervasyon yoksa e-posta gönderilmez.
 *
 * Tetikleme yöntemleri:
 *   1. Vercel Cron: vercel.json → { "path": "/api/reports/daily-manifest", "schedule": "0 6 * * *" }
 *   2. Manuel:      GET /api/reports/daily-manifest?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendDailyAdminManifestEmail } from '@/lib/email'
import { todayStrIstanbul } from '@/lib/istanbulTime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function checkSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return true // secret tanımlı değilse herkese açık (Vercel Cron)
  const url = new URL(request.url)
  return (
    url.searchParams.get('secret') === secret ||
    request.headers.get('authorization') === `Bearer ${secret}`
  )
}

export async function GET(request: NextRequest) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dateStr = todayStrIstanbul()
  try {
    const result = await sendDailyAdminManifestEmail(dateStr)
    return NextResponse.json({ ok: true, date: dateStr, ...result })
  } catch (e) {
    console.error('[daily-manifest] Rapor gönderilemedi', e)
    return NextResponse.json({ error: 'Rapor gönderilemedi' }, { status: 500 })
  }
}

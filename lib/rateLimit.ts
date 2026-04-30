import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type RateLimitBucket =
  | 'adminLogin'
  | 'publicForm'
  | 'booking'
  | 'bookingAction'
  | 'bookingLookup'
  | 'availability'
  | 'voucherAccess'
  | 'voucherPdf'
  | 'qr'
  | 'ticketPdf'

type UpstashWindow = '15 m' | '10 m' | '1 h'

/** Upstash pencereleri (slidingWindow ikinci argümanı). */
const UPSTASH_WINDOWS: Record<RateLimitBucket, { max: number; window: UpstashWindow }> = {
  adminLogin: { max: 10, window: '15 m' },
  publicForm: { max: 25, window: '10 m' },
  booking: { max: 35, window: '1 h' },
  bookingAction: { max: 30, window: '1 h' },
  bookingLookup: { max: 90, window: '1 h' },
  // Public takvim/kapasite sorguları için daha yumuşak sınır.
  availability: { max: 180, window: '10 m' },
  // E-posta linkinden gelen kısa süreli bilet yönlendirmesi.
  voucherAccess: { max: 80, window: '10 m' },
  // PDF üretimi CPU maliyetli olduğundan biraz daha sıkı.
  voucherPdf: { max: 40, window: '10 m' },
  // QR üretimi PDF'e göre daha hafif ama yine de hesaplama yapar.
  qr: { max: 90, window: '10 m' },
  // Genel PDF üretim endpoint'i için koruma.
  ticketPdf: { max: 25, window: '10 m' },
}

/** Bellek yedekleri (Upstash yok veya hata): sabit pencere, ms. */
const MEMORY_MS: Record<RateLimitBucket, { max: number; windowMs: number }> = {
  adminLogin: { max: 10, windowMs: 15 * 60 * 1000 },
  publicForm: { max: 25, windowMs: 10 * 60 * 1000 },
  booking: { max: 35, windowMs: 60 * 60 * 1000 },
  bookingAction: { max: 30, windowMs: 60 * 60 * 1000 },
  bookingLookup: { max: 90, windowMs: 60 * 60 * 1000 },
  availability: { max: 180, windowMs: 10 * 60 * 1000 },
  voucherAccess: { max: 80, windowMs: 10 * 60 * 1000 },
  voucherPdf: { max: 40, windowMs: 10 * 60 * 1000 },
  qr: { max: 90, windowMs: 10 * 60 * 1000 },
  ticketPdf: { max: 25, windowMs: 10 * 60 * 1000 },
}

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  return new Redis({ url, token })
}

const redisSingleton = createRedis()

const upstashLimiters: Partial<Record<RateLimitBucket, Ratelimit>> = {}
if (redisSingleton) {
  for (const bucket of Object.keys(UPSTASH_WINDOWS) as RateLimitBucket[]) {
    const w = UPSTASH_WINDOWS[bucket]
    upstashLimiters[bucket] = new Ratelimit({
      redis: redisSingleton,
      limiter: Ratelimit.slidingWindow(w.max, w.window),
      prefix: `rl:${bucket}`,
    })
  }
}

const memBuckets = new Map<string, { count: number; resetAt: number }>()

function memoryRateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now()
  if (memBuckets.size > 8000) {
    for (const [k, v] of memBuckets) {
      if (now >= v.resetAt) memBuckets.delete(k)
    }
  }
  let b = memBuckets.get(key)
  if (!b || now >= b.resetAt) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSec: 0 }
  }
  if (b.count >= max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) }
  }
  b.count += 1
  return { ok: true, retryAfterSec: 0 }
}

/**
 * Rate limit anahtarı için istemci IP’si.
 *
 * - **Upstash:** Tüm instance’lar aynı Redis sayacını kullanır; çoklu pod/Vercel region için env’de Upstash doldurun.
 * - **IP güvenilirliği:** İstemci doğrudan Node’a bağlanabiliyorsa `X-Forwarded-For` sahte gönderilebilir.
 *   Üretimde uygulamayı güvenilir edge/proxy arkasında çalıştırın (Vercel bu başlığı platform tarafında üretir).
 *   Kendi sunucunuzda nginx/caddy: yalnızca CDN/load balancer’dan gelen istekleri kabul edin; `real_ip`/trusted hops yapılandırın.
 *
 * Sıra: Cloudflare gerçek IP → nginx vb. `X-Real-IP` → `X-Forwarded-For` ilk hop (proxy zinciri soldan müşteri modeli).
 */
export function getClientIp(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf.slice(0, 128)

  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 128)

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first.slice(0, 128)
  }

  return 'unknown'
}

function tooManyResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: 'Çok fazla istek. Lütfen bir süre sonra tekrar deneyin.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    }
  )
}

/**
 * IP + bucket başına limit. Upstash Redis env doluysa tüm instance’larda tutarlı; değilse bellek içi yedek.
 * @returns null = devam, NextResponse = 429
 */
export async function rateLimitResponse(
  request: Request,
  bucket: RateLimitBucket
): Promise<NextResponse | null> {
  const id = `${bucket}:${getClientIp(request)}`
  const limiter = upstashLimiters[bucket]
  if (limiter) {
    try {
      const { success, reset } = await limiter.limit(id)
      if (!success) {
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
        return tooManyResponse(retryAfter)
      }
      return null
    } catch (e) {
      console.error('[rateLimit] Upstash hatası, bellek yedeği:', bucket, e)
    }
  }
  const m = MEMORY_MS[bucket]
  const { ok, retryAfterSec } = memoryRateLimit(id, m.max, m.windowMs)
  if (!ok) return tooManyResponse(retryAfterSec)
  return null
}

import { getSharedRedis } from '@/lib/rateLimit'
import { todayStrIstanbul } from '@/lib/istanbulTime'

/**
 * Site geneli günlük sohbet tavanı (İstanbul günü): modele giden mesaj sayısı
 * CHATBOT_DAILY_LIMIT'i (varsayılan 500) aşınca asistan o gün için ziyaretçiyi
 * WhatsApp'a yönlendirir — bot saldırısı ya da beklenmedik trafikte fatura
 * sürprizini önler. Hazır cevap önbelleğinden gelen yanıtlar sayılmaz.
 *
 * Upstash Redis tanımlıysa sayaç tüm sunucularda ortaktır; değilse her sunucu
 * örneği kendi sayacını tutar (Vercel'de birden çok örnek açılabileceği için
 * yaklaşık bir sınır olur).
 */
export const CHAT_DAILY_LIMIT = Math.max(1, Number(process.env.CHATBOT_DAILY_LIMIT) || 500)

const memory = new Map<string, number>()
const key = (day: string) => `chat:day:${day}`

/** Bir mesaj için yer ayırır; tavan aşıldıysa ok: false. */
export async function takeDailySlot(): Promise<{ ok: boolean; used: number; limit: number }> {
  const day = todayStrIstanbul()
  const redis = getSharedRedis()
  let used: number
  if (redis) {
    try {
      used = await redis.incr(key(day))
      if (used === 1) await redis.expire(key(day), 2 * 24 * 60 * 60)
    } catch (e) {
      // Redis erişilemezse sohbeti durdurma; bellek sayacına düş.
      console.error('[chat] daily counter redis failed', e instanceof Error ? e.message : e)
      used = (memory.get(day) ?? 0) + 1
      memory.set(day, used)
    }
  } else {
    if (memory.size > 3) memory.clear()
    used = (memory.get(day) ?? 0) + 1
    memory.set(day, used)
  }
  return { ok: used <= CHAT_DAILY_LIMIT, used, limit: CHAT_DAILY_LIMIT }
}

/** Admin durum sayfası için bugünkü sayı. */
export async function getDailyUsage(): Promise<{ used: number; limit: number; shared: boolean }> {
  const day = todayStrIstanbul()
  const redis = getSharedRedis()
  if (redis) {
    try {
      const v = await redis.get<number | string>(key(day))
      return { used: Number(v ?? 0), limit: CHAT_DAILY_LIMIT, shared: true }
    } catch {
      // aşağıdaki bellek değerine düş
    }
  }
  return { used: memory.get(day) ?? 0, limit: CHAT_DAILY_LIMIT, shared: false }
}

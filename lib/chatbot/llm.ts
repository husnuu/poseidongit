import { createHash } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { parseLocaleFromPathname } from '@/lib/i18n/paths'
import { CHAT_EFFORT, CHAT_MODEL } from './config'
import { buildCachedSystemText, CHAT_INSTRUCTIONS } from './prompt'

/** Sohbet rotası ve hazır cevaplar (quickAnswers.ts) için ortak model ayarları. */

/** Yanıt başına çıktı tavanı (düşünme dahil). Sohbet yanıtları kısa; maliyet tavanı. */
export const MAX_TOKENS = 6000

/**
 * Reddedilen istek sunucu tarafında yedek modelle yeniden denenir (Opus/Sonnet/Fable).
 * Haiku'da sunucu taraflı yedek yok — parametre gönderilmez.
 */
export const SERVER_FALLBACK = !/haiku/i.test(CHAT_MODEL)

/** Talimat + model + effort değişince hazır cevap önbelleği de yenilensin. */
export const PROMPT_KEY = createHash('sha1').update(`${CHAT_MODEL}|${CHAT_EFFORT}|${CHAT_INSTRUCTIONS}`).digest('hex').slice(0, 12)

let anthropic: Anthropic | null = null
export function getAnthropic(): Anthropic {
  anthropic ??= new Anthropic()
  return anthropic
}

/** Ortak istek alanları (model, effort, yedek model). */
export function baseParams() {
  return {
    model: CHAT_MODEL,
    max_tokens: MAX_TOKENS,
    ...(SERVER_FALLBACK ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    output_config: { effort: CHAT_EFFORT },
  }
}

const WEEKDAY_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

/** Önbelleklenen önekten sonra gelen, her istekte değişen bağlam. */
function dynamicContext(page: string | undefined): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const weekday = WEEKDAY_TR[new Date(`${date}T12:00:00Z`).getUTCDay()]
  const lines = [`Bugün: ${date} (${weekday}), saat ${get('hour')}:${get('minute')} (İstanbul).`]
  const path = page?.split(/[?#]/)[0].replace(/[^\w\-/%.]/g, '').slice(0, 200)
  if (path?.startsWith('/')) {
    lines.push(`Ziyaretçinin şu an bulunduğu sayfa: ${path} (site dili: ${parseLocaleFromPathname(path).locale}).`)
  }
  return lines.join('\n')
}

/** System prompt: önbelleğe alınan talimat + bilgi bloğu, ardından değişken bağlam. */
export function buildSystem(knowledgeText: string, page: string | undefined): Anthropic.Beta.BetaTextBlockParam[] {
  return [
    { type: 'text', text: buildCachedSystemText(knowledgeText), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicContext(page) },
  ]
}

export function logUsage(message: Anthropic.Beta.BetaMessage, extra: Record<string, unknown> = {}) {
  const u = message.usage
  console.info('[chat] usage', {
    model: message.model,
    ...extra,
    input: u.input_tokens,
    cacheRead: u.cache_read_input_tokens,
    cacheWrite: u.cache_creation_input_tokens,
    output: u.output_tokens,
    stop: message.stop_reason,
  })
}

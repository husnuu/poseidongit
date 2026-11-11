/** Sohbet asistanı açık mı: API anahtarı tanımlı ve CHATBOT_DISABLED değil. */
export function isChatbotEnabled(): boolean {
  const off = process.env.CHATBOT_DISABLED?.trim()
  if (off === '1' || off === 'true') return false
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

/**
 * Varsayılan Claude Haiku 5.5: sitedeki soru-cevap için en ekonomik model
 * (mesaj başı ~0,003 $). Daha güçlü model için CHATBOT_MODEL=claude-sonnet-5-5
 * veya claude-opus-5-5 (maliyet karşılaştırması: docs/CHATBOT_KURULUM.md).
 */
export const CHAT_MODEL = process.env.CHATBOT_MODEL?.trim() || 'claude-haiku-5-5'

const EFFORT_VALUES = ['low', 'medium', 'high'] as const
export type ChatEffort = (typeof EFFORT_VALUES)[number]

/** CHATBOT_EFFORT: low (varsayılan — sohbet için hızlı ve ekonomik) | medium | high. */
export const CHAT_EFFORT: ChatEffort = (EFFORT_VALUES as readonly string[]).includes(process.env.CHATBOT_EFFORT?.trim() ?? '')
  ? (process.env.CHATBOT_EFFORT!.trim() as ChatEffort)
  : 'low'

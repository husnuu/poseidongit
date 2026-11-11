import type Anthropic from '@anthropic-ai/sdk'
import { unstable_cache } from 'next/cache'
import { SITE_LOCALES, type SiteLocale } from '@/lib/i18n/config'
import { CHAT_COPY } from '@/components/chat/chatCopy'
import { getChatKnowledge } from './knowledge'
import { baseParams, buildSystem, getAnthropic, logUsage } from './llm'

/**
 * Sohbet penceresindeki hazır soruların cevabı bir kez üretilip saklanır;
 * sonraki tıklamalar modele hiç gitmez (maliyet: 0). Yalnızca cevabı güne ve
 * sayfaya bağlı olmayan sorular: "Hangi turlar var?" (0), "Fiyatlar" (1),
 * "Buluşma noktası" (3). "Yarın yer var mı?" (2) her seferinde canlı sorulur.
 * Sanity'de içerik değişince ('sanity' etiketi) ya da 6 saatte bir yenilenir.
 */
const CACHEABLE_INDEXES = [0, 1, 3]

/** Sohbetin ilk ve tek mesajı hazır sorulardan biriyse onu döndürür. */
export function matchQuickQuestion(messages: Array<{ role: string; content: string }>): { locale: SiteLocale; question: string } | null {
  if (messages.length !== 1 || messages[0].role !== 'user') return null
  const q = messages[0].content.trim()
  for (const locale of SITE_LOCALES) {
    for (const i of CACHEABLE_INDEXES) {
      if (CHAT_COPY[locale].suggestions[i] === q) return { locale, question: q }
    }
  }
  return null
}

async function generate(locale: string, question: string, promptKey: string): Promise<string> {
  const knowledge = await getChatKnowledge()
  // Sayfa bağlamı verilmez: cevap her sayfada aynı, genel olmalı. Araç yok — müsaitlik gerektirmez.
  const message = await getAnthropic().beta.messages.create({
    ...baseParams(),
    system: buildSystem(knowledge.text, undefined),
    messages: [{ role: 'user', content: question }],
  })
  logUsage(message, { quick: `${locale}:${promptKey}` })
  if (message.stop_reason !== 'end_turn') throw new Error(`quick answer stop: ${message.stop_reason}`)
  const text = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
  // Hata fırlatılırsa önbelleğe yazılmaz; istek normal (canlı) yoldan devam eder.
  if (!text) throw new Error('quick answer empty')
  return text
}

/** Argümanlar (dil, soru, talimat anahtarı) önbellek anahtarına girer. */
export const getQuickAnswer = unstable_cache(generate, ['chatbot-quick-v1'], { revalidate: 6 * 60 * 60, tags: ['sanity'] })

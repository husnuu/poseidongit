/**
 * POST /api/chat — sitedeki sohbet asistanı (Claude API).
 *
 * Gövde: { messages: [{ role: 'user' | 'assistant', content: string }], page?: string }
 * Yanıt: NDJSON akışı, satır satır:
 *   { t: 'text', v: '…' }      — yanıt metni parçası
 *   { t: 'status', v: 'availability' } — müsaitlik kontrol ediliyor
 *   { t: 'cards', v: [...] }   — yanıtta geçen turların kartları
 *   { t: 'done' } | { t: 'error', code: 'busy' | 'error' }
 * Günlük tavan aşıldıysa 429 { error: 'daily_limit' }.
 *
 * Bilgi kaynağı Sanity'den (lib/chatbot/knowledge.ts), system prompt'ta
 * önbelleğe alınır. Hazır soruların cevabı ayrıca saklanır (quickAnswers.ts).
 * Ortam değişkenleri: ANTHROPIC_API_KEY (zorunlu), CHATBOT_MODEL,
 * CHATBOT_EFFORT, CHATBOT_DAILY_LIMIT, CHATBOT_DISABLED. Bkz. docs/CHATBOT_KURULUM.md
 */
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimitResponse } from '@/lib/rateLimit'
import { getChatKnowledge, type ChatTourRef } from '@/lib/chatbot/knowledge'
import { CHECK_AVAILABILITY_TOOL, runCheckAvailability } from '@/lib/chatbot/availabilityTool'
import { isChatbotEnabled } from '@/lib/chatbot/config'
import { baseParams, buildSystem, getAnthropic, logUsage, PROMPT_KEY } from '@/lib/chatbot/llm'
import { getQuickAnswer, matchQuickQuestion } from '@/lib/chatbot/quickAnswers'
import { takeDailySlot } from '@/lib/chatbot/dailyBudget'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Sunucuya gönderilen son mesaj sayısı — uzun sohbetlerde maliyeti sınırlar. */
const HISTORY_LIMIT = 16
const MAX_TOOL_ROUNDS = 3

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(60),
  page: z.string().max(300).optional(),
})

const NDJSON_HEADERS = {
  'Content-Type': 'application/x-ndjson; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Accel-Buffering': 'no',
}

/** Son N mesaj; ilk mesaj kullanıcıdan olmalı, son mesaj da kullanıcının sorusu. */
function trimHistory(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Anthropic.Beta.BetaMessageParam[] {
  const recent = messages.slice(-HISTORY_LIMIT)
  while (recent.length && recent[0].role !== 'user') recent.shift()
  return recent.map((m) => ({ role: m.role, content: m.content }))
}

/**
 * Araç turunda asistan içeriğini geri gönderme: yanıt ortasında fallback
 * olduysa son `fallback` bloğundan önceki düşünme/araç bloklarını at
 * (yalnızca metin kalır); aksi halde içerik olduğu gibi döner.
 */
function echoContent(content: Anthropic.Beta.BetaContentBlock[]): Anthropic.Beta.BetaContentBlockParam[] {
  const lastFallback = content.map((b) => b.type).lastIndexOf('fallback')
  if (lastFallback < 0) return content as Anthropic.Beta.BetaContentBlockParam[]
  return content.filter((b, i) => i > lastFallback || b.type === 'text') as Anthropic.Beta.BetaContentBlockParam[]
}

/** Yanıtta bağlantısı geçen turlar (en fazla 3) — sohbette fotoğraflı kart olarak gösterilir. */
function tourCardsFor(text: string, tours: ChatTourRef[]) {
  const slugs = [...text.matchAll(/\]\(\/tur\/([\w-]+)/g)].map((m) => m[1])
  return [...new Set(slugs)]
    .map((slug) => tours.find((t) => t.slug === slug))
    .filter((t): t is ChatTourRef => Boolean(t))
    .slice(0, 3)
    .map((t) => ({ slug: t.slug, title: t.title, imageUrl: t.imageUrl, priceFrom: t.priceFrom, duration: t.duration, privateTour: t.privateTour }))
}

/** Hazır cevabı akış biçiminde döndürür (istemci için canlı yanıttan farkı yok). */
function staticAnswer(text: string, tours: ChatTourRef[]): Response {
  const lines = [{ t: 'text', v: text }]
  const cards = tourCardsFor(text, tours)
  const events: Array<Record<string, unknown>> = [...lines, ...(cards.length ? [{ t: 'cards', v: cards }] : []), { t: 'done' }]
  return new Response(events.map((e) => JSON.stringify(e)).join('\n') + '\n', { headers: NDJSON_HEADERS })
}

export async function POST(request: Request) {
  if (!isChatbotEnabled()) return NextResponse.json({ error: 'disabled' }, { status: 503 })

  const limited = await rateLimitResponse(request, 'chat')
  if (limited) return limited

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  const messages = trimHistory(parsed.data.messages)
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  let knowledge: Awaited<ReturnType<typeof getChatKnowledge>>
  try {
    knowledge = await getChatKnowledge()
  } catch (e) {
    console.error('[chat] knowledge failed', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }

  // Hazır soru (sohbetin ilk mesajı): saklanan cevap — modele gitmez, tavana sayılmaz.
  const quick = matchQuickQuestion(parsed.data.messages)
  if (quick) {
    try {
      const text = await getQuickAnswer(quick.locale, quick.question, PROMPT_KEY)
      console.info('[chat] quick answer', { locale: quick.locale })
      return staticAnswer(text, knowledge.tours)
    } catch (e) {
      console.error('[chat] quick answer failed, falling back to live', e instanceof Error ? e.message : e)
    }
  }

  const slot = await takeDailySlot()
  if (!slot.ok) {
    console.warn('[chat] daily limit reached', { used: slot.used, limit: slot.limit })
    return NextResponse.json({ error: 'daily_limit' }, { status: 429 })
  }

  const system = buildSystem(knowledge.text, parsed.data.page)
  const client = getAnthropic()
  const encoder = new TextEncoder()

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: Record<string, unknown>) => controller.enqueue(encoder.encode(`${JSON.stringify(o)}\n`))
      const convo: Anthropic.Beta.BetaMessageParam[] = [...messages]
      let sentText = false
      let fullText = ''
      let needSeparator = false
      let jsonRetries = 0
      try {
        for (let round = 0; ; round++) {
          const stream = client.beta.messages.stream(
            { ...baseParams(), system, tools: [CHECK_AVAILABILITY_TOOL], messages: convo },
            { signal: request.signal }
          )
          stream.on('text', (delta) => {
            if (!delta) return
            if (needSeparator) {
              send({ t: 'text', v: '\n\n' })
              needSeparator = false
            }
            sentText = true
            fullText += delta
            send({ t: 'text', v: delta })
          })

          let message: Anthropic.Beta.BetaMessage
          try {
            message = await stream.finalMessage()
            jsonRetries = 0
          } catch (err) {
            // Araç girdisi hiç ayrıştırılamadıysa turu bir kez yeniden dene; API hataları dışarı.
            if (err instanceof Anthropic.APIError || request.signal.aborted || jsonRetries++ >= 1) throw err
            continue
          }
          logUsage(message, { round })

          if (message.stop_reason === 'refusal') {
            send({ t: 'refusal' })
            break
          }
          const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
          // max_tokens ile kesilmiş bir araç çağrısı çalıştırılmaz (stop_reason 'tool_use' değil).
          if (message.stop_reason !== 'tool_use' || toolUses.length === 0) break
          if (round >= MAX_TOOL_ROUNDS) {
            send({ t: 'incomplete' })
            break
          }

          convo.push({ role: 'assistant', content: echoContent(message.content) })
          send({ t: 'status', v: 'availability' })
          const results: Anthropic.Beta.BetaToolResultBlockParam[] = await Promise.all(
            toolUses.map(async (tu) => {
              if (tu.name !== CHECK_AVAILABILITY_TOOL.name) {
                return { type: 'tool_result' as const, tool_use_id: tu.id, is_error: true, content: 'unknown_tool' }
              }
              const r = await runCheckAvailability(tu.input, knowledge.tours, request)
              return { type: 'tool_result' as const, tool_use_id: tu.id, is_error: r.isError, content: r.content }
            })
          )
          convo.push({ role: 'user', content: results })
          needSeparator = sentText
        }
        const cards = tourCardsFor(fullText, knowledge.tours)
        if (cards.length) send({ t: 'cards', v: cards })
        send({ t: 'done' })
      } catch (err) {
        if (!request.signal.aborted) {
          if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
            console.warn('[chat] upstream busy', err.status)
            send({ t: 'error', code: 'busy' })
          } else if (err instanceof Anthropic.APIConnectionError) {
            const cause = err.cause as (Error & { cause?: { code?: string; message?: string } }) | undefined
            console.error('[chat] connection error', cause?.message, cause?.cause?.code ?? cause?.cause?.message)
            send({ t: 'error', code: 'busy' })
          } else if (err instanceof Anthropic.APIError) {
            console.error('[chat] api error', err.status, err.message)
            send({ t: 'error', code: 'error' })
          } else {
            console.error('[chat] failed', err instanceof Error ? err.message : err)
            send({ t: 'error', code: 'error' })
          }
        }
      } finally {
        try {
          controller.close()
        } catch {
          // istemci bağlantıyı kapattı
        }
      }
    },
  })

  return new Response(body, { headers: NDJSON_HEADERS })
}

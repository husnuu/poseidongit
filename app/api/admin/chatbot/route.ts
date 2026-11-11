/**
 * GET /api/admin/chatbot — sohbet asistanının durumu: açık mı, hangi model,
 * bilgi kaynağının boyutu ve Studio'dan yüklenen belgelerin okunma durumu.
 */
import { NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { CHAT_EFFORT, CHAT_MODEL, isChatbotEnabled } from '@/lib/chatbot/config'
import { getChatKnowledge } from '@/lib/chatbot/knowledge'
import { MAX_DOC_CHARS } from '@/lib/chatbot/documents'
import { getDailyUsage } from '@/lib/chatbot/dailyBudget'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  if (!(await authorizeAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const [k, daily] = await Promise.all([getChatKnowledge(), getDailyUsage()])
    return NextResponse.json({
      enabled: isChatbotEnabled(),
      model: CHAT_MODEL,
      effort: CHAT_EFFORT,
      knowledgeChars: k.text.length,
      tours: k.tours.length,
      documents: k.documents,
      notesChars: k.notesChars,
      maxDocChars: MAX_DOC_CHARS,
      daily,
    })
  } catch (e) {
    console.error('[admin/chatbot]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Bilgi kaynağı okunamadı (Sanity).' }, { status: 500 })
  }
}

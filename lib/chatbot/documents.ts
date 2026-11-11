import { unstable_cache } from 'next/cache'

/**
 * Studio'da "Sohbet Asistanı" belgesine yüklenen dosyalardan (PDF, Word,
 * .txt, .md) düz metin çıkarır. Sanity dosya adresi içerikle birlikte değişir
 * (asset kimliği dosyanın özetidir), bu yüzden sonuç asset kimliğine göre
 * uzun süre önbellekte tutulur — dosya her mesajda yeniden okunmaz.
 */

/** İndirilecek en büyük dosya. */
const MAX_FILE_BYTES = 15 * 1024 * 1024
/**
 * Belge başına en fazla karakter (~30 bin token). Belge her mesajda modele
 * gittiği için tavan maliyeti korur; aşılırsa metin kesilir ve durum sayfasında
 * (/admin/chatbot) "kısaltıldı" görünür.
 */
export const MAX_DOC_CHARS = 120_000

export type ExtractedDoc = {
  text: string
  chars: number
  truncated: boolean
  pages?: number
  error?: 'download_failed' | 'too_large' | 'unsupported_type' | 'no_text' | 'parse_failed'
}

function kindOf(filename: string, mimeType: string): 'pdf' | 'docx' | 'text' | null {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf'
  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
  if (['txt', 'md', 'markdown', 'csv'].includes(ext) || mimeType.startsWith('text/')) return 'text'
  return null
}

function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function extractDocumentText(assetId: string, url: string, filename: string, mimeType: string): Promise<ExtractedDoc> {
  const kind = kindOf(filename, mimeType)
  if (!kind) return { text: '', chars: 0, truncated: false, error: 'unsupported_type' }

  let bytes: ArrayBuffer
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const len = Number(res.headers.get('content-length') ?? 0)
    if (len > MAX_FILE_BYTES) return { text: '', chars: 0, truncated: false, error: 'too_large' }
    bytes = await res.arrayBuffer()
    if (bytes.byteLength > MAX_FILE_BYTES) return { text: '', chars: 0, truncated: false, error: 'too_large' }
  } catch (e) {
    console.error('[chatbot/doc] download failed', { assetId, message: e instanceof Error ? e.message : e })
    return { text: '', chars: 0, truncated: false, error: 'download_failed' }
  }

  let raw = ''
  let pages: number | undefined
  try {
    if (kind === 'pdf') {
      const { extractText, getDocumentProxy } = await import('unpdf')
      const pdf = await getDocumentProxy(new Uint8Array(bytes))
      const out = await extractText(pdf, { mergePages: true })
      raw = out.text
      pages = out.totalPages
    } else if (kind === 'docx') {
      const mammoth = (await import('mammoth')).default
      raw = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value
    } else {
      raw = new TextDecoder('utf-8').decode(bytes)
    }
  } catch (e) {
    console.error('[chatbot/doc] parse failed', { assetId, kind, message: e instanceof Error ? e.message : e })
    return { text: '', chars: 0, truncated: false, pages, error: 'parse_failed' }
  }

  const text = tidy(raw)
  // Taranmış (fotoğraf) PDF'lerde metin katmanı yoktur.
  if (text.replace(/\s/g, '').length < 20) return { text: '', chars: 0, truncated: false, pages, error: 'no_text' }
  const truncated = text.length > MAX_DOC_CHARS
  if (truncated) console.warn('[chatbot/doc] truncated', { assetId, chars: text.length, max: MAX_DOC_CHARS })
  const kept = truncated ? text.slice(0, MAX_DOC_CHARS) : text
  return { text: kept, chars: text.length, truncated, pages }
}

/** Asset kimliği + adres önbellek anahtarına girer; aynı dosya bir kez okunur. */
export const extractChatDocument = unstable_cache(extractDocumentText, ['chatbot-doc-v1'], { revalidate: 60 * 60 * 24 * 30 })

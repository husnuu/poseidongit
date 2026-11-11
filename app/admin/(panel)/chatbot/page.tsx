'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '@/components/admin/AdminAuthContext'
import { adminFetchInit } from '@/lib/adminRequestInit'

type DocStatus = {
  title: string
  filename: string
  chars: number
  truncated: boolean
  pages?: number
  error?: 'download_failed' | 'too_large' | 'unsupported_type' | 'no_text' | 'parse_failed'
  preview: string
}

type StatusResponse = {
  enabled: boolean
  model: string
  effort: string
  knowledgeChars: number
  tours: number
  documents: DocStatus[]
  notesChars: number
  maxDocChars: number
  daily: { used: number; limit: number; shared: boolean }
}

const ERROR_TEXT: Record<NonNullable<DocStatus['error']>, string> = {
  download_failed: 'Dosya indirilemedi. Studio’da dosyayı yeniden yükleyin.',
  too_large: 'Dosya çok büyük (15 MB üstü).',
  unsupported_type: 'Desteklenmeyen dosya türü. PDF, Word (.docx), .txt veya .md yükleyin.',
  no_text: 'Dosyada okunabilir yazı yok — büyük ihtimalle taranmış/fotoğraf PDF. Metni Word’e yazıp yükleyin ya da “Ek bilgiler” alanına yapıştırın.',
  parse_failed: 'Dosya açılamadı (bozuk ya da şifreli olabilir).',
}

/** ~4 karakter ≈ 1 token (Türkçe metin için kaba tahmin). */
const approxTokens = (chars: number) => Math.round(chars / 4).toLocaleString('tr-TR')

export default function AdminChatbotPage() {
  const { initializing, isAdmin, user } = useAdminAuth()
  const email = user?.email?.trim().toLowerCase() || null
  const init = useCallback((i: RequestInit = {}) => adminFetchInit(i, { adminEmail: email }), [email])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/chatbot', init())
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setStatus(data as StatusResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [init])

  useEffect(() => {
    if (isAdmin) void load()
  }, [isAdmin, load])

  if (initializing) return <div className="p-8 text-sm text-zinc-500">Yükleniyor…</div>
  if (!isAdmin) return <div className="p-8 text-sm text-zinc-500">Bu sayfa için admin girişi gerekli.</div>

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Sohbet Asistanı</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Asistan turları, yatları ve SSS sayfasını Sanity’den otomatik okur. Ek bilgi belgelerini Studio → <b>Sohbet Asistanı — bilgi belgeleri</b> bölümünden yükleyin; okunup okunmadığı aşağıda görünür (değişiklikler birkaç dakika içinde yansır).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </button>
      </header>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {status && (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${status.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}
            >
              <span className={`h-2 w-2 rounded-full ${status.enabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {status.enabled ? 'Açık — sitede “Soru sor” butonu görünüyor' : 'Kapalı — ANTHROPIC_API_KEY tanımlı değil (ya da CHATBOT_DISABLED açık)'}
            </span>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-5">
              <div className="rounded-lg bg-zinc-50 px-3 py-2">
                <dt className="text-xs font-semibold text-zinc-500">Model</dt>
                <dd className="mt-0.5 font-mono text-zinc-800">{status.model}</dd>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2">
                <dt className="text-xs font-semibold text-zinc-500">Yanıt derinliği</dt>
                <dd className="mt-0.5 font-mono text-zinc-800">{status.effort}</dd>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2">
                <dt className="text-xs font-semibold text-zinc-500">Tur sayısı</dt>
                <dd className="mt-0.5 text-zinc-800">{status.tours}</dd>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2">
                <dt className="text-xs font-semibold text-zinc-500">Bugünkü mesaj</dt>
                <dd className="mt-0.5 text-zinc-800">
                  {status.daily.used.toLocaleString('tr-TR')} / {status.daily.limit.toLocaleString('tr-TR')}
                </dd>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2">
                <dt className="text-xs font-semibold text-zinc-500">Bilgi kaynağı</dt>
                <dd className="mt-0.5 text-zinc-800">~{approxTokens(status.knowledgeChars)} token</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-zinc-500">
              Günlük tavan (CHATBOT_DAILY_LIMIT) aşılınca asistan o gün ziyaretçileri WhatsApp’a yönlendirir. Hazır soruların saklanan cevapları sayılmaz.
              {!status.daily.shared && ' Upstash Redis tanımlı olmadığı için sayaç her sunucu örneğinde ayrı tutuluyor (yaklaşık sınır).'}
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-bold text-zinc-900">Yüklenen belgeler</h2>
            {status.documents.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">
                Henüz belge yok. Studio → Sohbet Asistanı — bilgi belgeleri → “Bilgi belgeleri” alanından PDF, Word, .txt veya .md yükleyip yayınlayın.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-zinc-100">
                {status.documents.map((d, i) => (
                  <li key={`${d.filename}-${i}`} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-zinc-900">{d.title}</p>
                        <p className="text-xs text-zinc-500">{d.filename}</p>
                      </div>
                      {d.error ? (
                        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Okunamadı</span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Okundu · {d.pages ? `${d.pages} sayfa · ` : ''}~{approxTokens(Math.min(d.chars, status.maxDocChars))} token
                        </span>
                      )}
                    </div>
                    {d.error && <p className="mt-2 text-sm text-red-700">{ERROR_TEXT[d.error]}</p>}
                    {d.truncated && (
                      <p className="mt-2 text-sm text-amber-700">
                        Belge çok uzun: yalnızca ilk {status.maxDocChars.toLocaleString('tr-TR')} karakteri kullanılıyor. Belgeyi kısaltın ya da bölün.
                      </p>
                    )}
                    {d.preview && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-semibold text-zinc-500">Okunan metnin başı</summary>
                        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">{d.preview}</pre>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              “Ek bilgiler” metin alanı: {status.notesChars > 0 ? `${status.notesChars.toLocaleString('tr-TR')} karakter` : 'boş'}.
            </p>
          </section>
        </>
      )}
    </div>
  )
}

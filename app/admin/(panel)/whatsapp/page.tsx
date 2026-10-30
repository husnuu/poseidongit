'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '@/components/admin/AdminAuthContext'
import { adminFetchInit } from '@/lib/adminRequestInit'

type Preset = 'weather_cancel' | 'delay' | 'custom'
type Kind = 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'disruption'

type StatusResponse = {
  enabled: boolean
  tableMissing: boolean
  templates: Record<Kind, string>
  messages: Array<{
    id: string
    booking_id: string | null
    kind: string
    to_phone: string
    status: string
    error: string | null
    created_at: string | null
  }>
}

type TripResponse = {
  total: number
  withPhone: number
  optedOut: number
  tours: Array<{ id: string; title: string }>
  preview: { body: string; buttonText: string; template: string; language: string } | null
  bookings: Array<{ id: string; name: string; phone: string; time: string | null; tourTitle: string | null; optedOut: boolean }>
}

const KIND_LABEL: Record<string, string> = {
  confirmation: 'Rezervasyon onayı',
  reminder_24h: '24 saat hatırlatma',
  reminder_2h: '2 saat hatırlatma',
  disruption: 'Sefer duyurusu',
}

const STATUS_STYLE: Record<string, string> = {
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  read: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  failed: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  skipped: 'bg-zinc-100 text-zinc-600 border-zinc-200',
}

function kindLabel(kind: string): string {
  const base = kind.split(':')[0]
  if (kind.startsWith('test:')) return `Test · ${KIND_LABEL[kind.split(':')[1]] ?? kind}`
  if (kind.startsWith('confirmation:resend')) return 'Onay (yeniden)'
  return KIND_LABEL[base] ?? kind
}

function todayIstanbul(): string {
  return new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10)
}

export default function AdminWhatsAppPage() {
  const { initializing, isAdmin, user } = useAdminAuth()
  const email = user?.email?.trim().toLowerCase() || null
  const init = useCallback((i: RequestInit = {}) => adminFetchInit(i, { adminEmail: email }), [email])

  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const [date, setDate] = useState(todayIstanbul())
  const [tourId, setTourId] = useState('')
  const [time, setTime] = useState('')
  const [preset, setPreset] = useState<Preset>('weather_cancel')
  const [newTime, setNewTime] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [trip, setTrip] = useState<TripResponse | null>(null)
  const [tripLoading, setTripLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const [testBookingId, setTestBookingId] = useState('')
  const [testKind, setTestKind] = useState<Kind>('confirmation')
  const [testPhone, setTestPhone] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp', init())
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setStatus(json)
      setStatusError(null)
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : String(e))
    }
  }, [init])

  const loadTrip = useCallback(async () => {
    setTripLoading(true)
    try {
      const q = new URLSearchParams({ date, preset })
      if (tourId) q.set('tourId', tourId)
      if (time) q.set('time', time)
      if (newTime) q.set('newTime', newTime)
      if (customMessage) q.set('message', customMessage)
      const res = await fetch(`/api/admin/whatsapp?${q.toString()}`, init())
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setTrip(json)
    } catch (e) {
      setTrip(null)
      setResult(`Hata: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setTripLoading(false)
    }
  }, [date, tourId, time, preset, newTime, customMessage, init])

  useEffect(() => {
    if (isAdmin) void loadStatus()
  }, [isAdmin, loadStatus])

  useEffect(() => {
    if (!isAdmin) return
    const t = setTimeout(() => void loadTrip(), 350)
    return () => clearTimeout(t)
  }, [isAdmin, loadTrip])

  const sendBroadcast = async () => {
    if (!trip || trip.total === 0) return
    const label = preset === 'weather_cancel' ? 'hava nedeniyle İPTAL' : preset === 'delay' ? 'GECİKME' : 'özel duyuru'
    if (!window.confirm(`${date} tarihli seferdeki ${trip.withPhone} yolcuya "${label}" mesajı WhatsApp ile gönderilecek. Emin misiniz?`)) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(
        '/api/admin/whatsapp',
        init({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'broadcast', date, tourId: tourId || undefined, time: time || undefined, preset, newTime, customMessage }),
        })
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setResult(`Gönderildi: ${json.sent} · Atlandı: ${json.skipped} · Başarısız: ${json.failed} (toplam ${json.total})`)
      void loadStatus()
    } catch (e) {
      setResult(`Hata: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSending(false)
    }
  }

  const sendTest = async () => {
    setTestResult(null)
    try {
      const res = await fetch(
        '/api/admin/whatsapp',
        init({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'test',
            bookingId: testBookingId.trim(),
            kind: testKind,
            to: testPhone,
            message: testKind === 'disruption' ? 'Bu bir test duyurusudur.' : undefined,
          }),
        })
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setTestResult(
        json.result === 'sent'
          ? 'Gönderildi ✓'
          : json.result === 'skipped'
            ? `Gönderilmedi: ${json.reason}`
            : `Başarısız: ${json.error}`
      )
      void loadStatus()
    } catch (e) {
      setTestResult(`Hata: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (initializing) return <div className="p-8 text-sm text-zinc-500">Yükleniyor…</div>
  if (!isAdmin) return <div className="p-8 text-sm text-zinc-500">Bu sayfa için admin girişi gerekli.</div>

  const input = 'h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-[#2168b8] focus:ring-2 focus:ring-[#2168b8]/15'

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900">WhatsApp Bildirimleri</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Rezervasyon onayı (bilet görselli) ve 24 saat / 2 saat hatırlatmaları otomatik gider. Buradan bir seferdeki tüm yolculara iptal veya gecikme duyurusu gönderebilirsiniz.
        </p>
      </header>

      {/* Durum */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        {statusError && <p className="text-sm text-red-600">{statusError}</p>}
        {status && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${status.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}
              >
                <span className={`h-2 w-2 rounded-full ${status.enabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {status.enabled ? 'Bağlı — mesajlar gönderiliyor' : 'Bağlı değil — WhatsApp anahtarları tanımlanmadı, mesaj gönderilmiyor'}
              </span>
              {status.tableMissing && (
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                  Kayıt tablosu yok — docs/supabase-whatsapp.sql çalıştırılmalı (hatırlatmalar bu olmadan gönderilmez)
                </span>
              )}
            </div>
            <div className="grid gap-2 text-xs text-zinc-500 sm:grid-cols-4">
              {(Object.keys(status.templates) as Kind[]).map((k) => (
                <div key={k} className="rounded-lg bg-zinc-50 px-3 py-2">
                  <div className="font-semibold text-zinc-700">{KIND_LABEL[k]}</div>
                  <code className="break-all">{status.templates[k]}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sefer duyurusu */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-bold text-zinc-900">Sefer duyurusu (iptal / gecikme)</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-zinc-700">
                Tarih
                <input type="date" className={`${input} mt-1`} value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Kalkış saati (isteğe bağlı)
                <input type="time" className={`${input} mt-1`} value={time} onChange={(e) => setTime(e.target.value)} />
              </label>
            </div>
            <label className="block text-sm font-medium text-zinc-700">
              Tur
              <select className={`${input} mt-1`} value={tourId} onChange={(e) => setTourId(e.target.value)}>
                <option value="">O günkü tüm turlar</option>
                {(trip?.tours ?? []).filter((t) => t.id).map((t) => (
                  <option key={t.id} value={t.id}>{t.title || t.id}</option>
                ))}
              </select>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-zinc-700">Duyuru</legend>
              {([
                ['weather_cancel', 'Hava nedeniyle iptal (tam iade / ücretsiz tarih değişikliği)'],
                ['delay', 'Kalkış saati değişti / gecikme'],
                ['custom', 'Özel metin'],
              ] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm text-zinc-700">
                  <input type="radio" name="preset" checked={preset === v} onChange={() => setPreset(v)} />
                  {l}
                </label>
              ))}
            </fieldset>
            {preset === 'delay' && (
              <label className="block text-sm font-medium text-zinc-700">
                Yeni kalkış saati
                <input type="time" className={`${input} mt-1`} value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              </label>
            )}
            {preset === 'custom' && (
              <label className="block text-sm font-medium text-zinc-700">
                Duyuru metni (yolcunun dilinden bağımsız, olduğu gibi gider)
                <textarea
                  className="mt-1 min-h-[96px] w-full rounded-lg border border-zinc-300 p-3 text-sm outline-none focus:border-[#2168b8]"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  maxLength={600}
                />
              </label>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-[#e7f3ee] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">Önizleme (ilk yolcu)</p>
              {tripLoading ? (
                <p className="text-sm text-zinc-500">Yükleniyor…</p>
              ) : trip?.preview ? (
                <div className="rounded-lg bg-white p-3 text-sm shadow-sm">
                  <p className="whitespace-pre-line text-zinc-800">{trip.preview.body}</p>
                  <p className="mt-3 border-t pt-2 text-center font-semibold text-[#2168b8]">{trip.preview.buttonText}</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Bu seferde aktif rezervasyon yok.</p>
              )}
            </div>
            {trip && (
              <p className="text-sm text-zinc-600">
                Aktif rezervasyon: <b>{trip.total}</b> · Geçerli telefon: <b>{trip.withPhone}</b> · WhatsApp izni yok: <b>{trip.optedOut}</b>
              </p>
            )}
            <button
              type="button"
              onClick={sendBroadcast}
              disabled={sending || !trip || trip.total === 0 || !status?.enabled}
              className="h-11 w-full rounded-lg bg-[#2168b8] text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? 'Gönderiliyor…' : 'Duyuruyu gönder'}
            </button>
            {result && <p className="text-sm text-zinc-700">{result}</p>}
          </div>
        </div>
        {trip && trip.bookings.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-700">Yolcular ({trip.bookings.length})</summary>
            <ul className="mt-2 divide-y rounded-lg border text-sm">
              {trip.bookings.map((b) => (
                <li key={b.id} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                  <span>{b.name || '—'} <span className="text-zinc-400">· {b.tourTitle} {b.time ?? ''}</span></span>
                  <span className={b.optedOut ? 'text-zinc-400 line-through' : 'text-zinc-600'}>{b.phone}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Test */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-bold text-zinc-900">Test gönderimi</h2>
        <p className="mt-1 text-sm text-zinc-500">Bir rezervasyonun mesajını kendi numaranıza gönderip nasıl göründüğünü kontrol edin.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <input className={input} placeholder="Rezervasyon ID" value={testBookingId} onChange={(e) => setTestBookingId(e.target.value)} />
          <select className={input} value={testKind} onChange={(e) => setTestKind(e.target.value as Kind)}>
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
          <input className={input} placeholder="Telefon (+90 5xx…)" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
          <button
            type="button"
            onClick={sendTest}
            disabled={!testBookingId.trim() || !testPhone.trim()}
            className="h-10 rounded-lg border-2 border-[#2168b8] text-sm font-bold text-[#2168b8] disabled:opacity-50"
          >
            Test gönder
          </button>
        </div>
        {testResult && <p className="mt-2 text-sm text-zinc-700">{testResult}</p>}
      </section>

      {/* Geçmiş */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Son gönderimler</h2>
          <button type="button" onClick={() => void loadStatus()} className="text-sm font-semibold text-[#2168b8]">Yenile</button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Zaman</th>
                <th className="py-2 pr-3">Tür</th>
                <th className="py-2 pr-3">Telefon</th>
                <th className="py-2 pr-3">Durum</th>
                <th className="py-2">Rezervasyon</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(status?.messages ?? []).map((m) => (
                <tr key={m.id}>
                  <td className="py-2 pr-3 text-zinc-500">{m.created_at ? new Date(m.created_at).toLocaleString('tr-TR') : '—'}</td>
                  <td className="py-2 pr-3">{kindLabel(m.kind)}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{m.to_phone}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[m.status] ?? STATUS_STYLE.skipped}`} title={m.error ?? ''}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs text-zinc-500">{m.booking_id?.slice(0, 8) ?? '—'}</td>
                </tr>
              ))}
              {(status?.messages ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-400">Henüz gönderim yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

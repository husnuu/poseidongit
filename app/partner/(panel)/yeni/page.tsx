'use client'

import { useEffect, useMemo, useState } from 'react'
import { PartnerCard } from '@/components/partner/PartnerReports'
import { formatMoney } from '@/lib/partner/commission'

type TourOption = {
  id: string
  title: string
  kind: 'online' | 'cash' | 'private'
  classes: { key: string; label: string }[]
}

type Result =
  | { kind: 'online'; totalPrice: number; amountDue: number; paymentUrl: string; emailSent: boolean }
  | { kind: 'cash' | 'private'; totalPrice: number }

const EMPTY_FORM = {
  tourId: '',
  date: '',
  classKey: '',
  adult: 2,
  child: 0,
  infant: 0,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  note: '',
  locale: 'tr',
}

const inputClass = 'mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-[16px] outline-none focus:border-primary'
const labelClass = 'text-xs font-bold text-zinc-600'

export default function PartnerNewBookingPage() {
  const [tours, setTours] = useState<TourOption[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    void fetch('/api/partner/tours')
      .then((r) => r.json())
      .then((j: { tours?: TourOption[]; error?: string }) => {
        if (j.tours) setTours(j.tours)
        else setError(j.error ?? 'Turlar yüklenemedi.')
      })
      .catch(() => setError('Turlar yüklenemedi.'))
  }, [])

  const tour = useMemo(() => tours.find((t) => t.id === form.tourId), [tours, form.tourId])
  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/partner/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: form.tourId,
          date: form.date,
          classKey: form.classKey || tour?.classes[0]?.key,
          counts: { adult: form.adult, child: form.child, infant: form.infant },
          customer: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            note: form.note || undefined,
          },
          locale: form.locale,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) setResult(json as Result)
      else setError(json.error ?? 'Rezervasyon oluşturulamadı.')
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const whatsappHref =
      result.kind === 'online'
        ? `https://wa.me/?text=${encodeURIComponent(`Rezervasyonunuzu tamamlamak için ödeme bağlantınız / Your payment link: ${result.paymentUrl}`)}`
        : ''
    return (
      <div className="max-w-xl">
        <PartnerCard title="Rezervasyon oluşturuldu">
          {result.kind === 'online' && (
            <div className="flex flex-col gap-3 text-sm">
              <p>
                Toplam <b>{formatMoney(result.totalPrice)}</b>, şimdi ödenecek <b>{formatMoney(result.amountDue)}</b>.
                Ödeme tamamlanınca rezervasyon onaylanır ve bilet misafire gönderilir.
              </p>
              <p className={result.emailSent ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                {result.emailSent
                  ? 'Ödeme bağlantısı misafirin e-postasına gönderildi.'
                  : 'E-posta gönderilemedi. Bağlantıyı misafire WhatsApp ile iletin.'}
              </p>
              <code className="break-all rounded-md bg-zinc-50 px-3 py-2 text-xs">{result.paymentUrl}</code>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="self-start rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                WhatsApp ile gönder
              </a>
            </div>
          )}
          {result.kind === 'cash' && (
            <p className="text-sm">Rezervasyon alındı. Toplam {formatMoney(result.totalPrice)} misafirden teknede nakit tahsil edilir.</p>
          )}
          {result.kind === 'private' && (
            <p className="text-sm">
              Özel tur talebi Poseidon ekibine iletildi (grup fiyatı {formatMoney(result.totalPrice)}). Online ödeme yoktur; ekip misafirle iletişime geçecek.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setResult(null)
              setForm(EMPTY_FORM)
            }}
            className="mt-4 rounded-md border border-zinc-200 px-3 py-2 text-xs font-bold text-[#131719] hover:bg-zinc-50"
          >
            Yeni rezervasyon
          </button>
        </PartnerCard>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <PartnerCard title="Misafir için rezervasyon başlat">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            Tur
            <select required value={form.tourId} onChange={(e) => setForm((f) => ({ ...f, tourId: e.target.value, classKey: '' }))} className={inputClass}>
              <option value="">Seçin</option>
              {tours.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Tarih
            <input type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} className={inputClass} />
          </label>
          {tour && tour.classes.length > 1 && (
            <label className={labelClass}>
              Bilet sınıfı
              <select required value={form.classKey} onChange={(e) => set('classKey', e.target.value)} className={inputClass}>
                <option value="">Seçin</option>
                {tour.classes.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </label>
          )}
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            {(
              [
                ['adult', 'Yetişkin'],
                ['child', 'Çocuk'],
                ['infant', 'Bebek'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className={labelClass}>
                {label}
                <input type="number" min={0} max={200} value={form[key]} onChange={(e) => set(key, Number(e.target.value))} className={inputClass} />
              </label>
            ))}
          </div>
          <label className={labelClass}>
            Misafir adı
            <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Misafir soyadı
            <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            E-posta
            <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Telefon
            <input type="tel" required value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            E-posta dili
            <select value={form.locale} onChange={(e) => set('locale', e.target.value)} className={inputClass}>
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="ru">Русский</option>
            </select>
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Not (isteğe bağlı)
            <textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} className={inputClass} />
          </label>
          {error && <p role="alert" className="text-sm font-semibold text-red-600 sm:col-span-2">{error}</p>}
          <button type="submit" disabled={submitting} className="rounded-md bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 sm:col-span-2">
            {submitting
              ? 'Oluşturuluyor…'
              : tour?.kind === 'private'
                ? 'Talebi gönder'
                : tour?.kind === 'cash'
                  ? 'Rezervasyonu oluştur'
                  : 'Rezervasyonu oluştur ve ödeme linki gönder'}
          </button>
          <p className="text-xs text-zinc-500 sm:col-span-2">
            Fiyat tur, tarih ve kişi sayısına göre otomatik hesaplanır. First Class için misafiri QR sayfanıza yönlendirin (loca seçimi gerekir).
          </p>
        </form>
      </PartnerCard>
    </div>
  )
}

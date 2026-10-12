'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminBookingMonthCalendar from '@/components/admin/bookings/AdminBookingMonthCalendar'
import { useAdminAuth } from '@/components/admin/AdminAuthContext'
import { adminFetchInit } from '@/lib/adminRequestInit'
import { sortManifestRowsAlphabetically } from '@/lib/manifestSort'
import {
  addManifestManualEntry,
  clearManifestManualEntriesForDate,
  listManifestManualEntries,
  removeManifestManualEntry,
} from '@/lib/manifestManualStorage'
import type { ManifestClassId, ManifestPrintRow } from '@/types/manifestPrint'
import { MANIFEST_CLASS_OPTIONS } from '@/types/manifestPrint'
import styles from './ManifestPrint.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(date: string): string {
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

function paxTotal(row: Pick<ManifestPrintRow, 'adult' | 'child' | 'infant'>): number {
  return row.adult + row.child + row.infant
}

function formatMoney(amount: number | undefined, currency = 'TRY'): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

function CounterField({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={styles.counterBtn}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`${label} azalt`}
        >
          −
        </button>
        <span className="min-w-[2rem] text-center text-lg font-black text-[#131719]">{value}</span>
        <button
          type="button"
          className={styles.counterBtn}
          onClick={() => onChange(value + 1)}
          aria-label={`${label} artır`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function ManifestPrintPage() {
  const { user } = useAdminAuth()
  const adminEmail = user?.email ?? null

  const [date, setDate] = useState(todayIso)
  const [classFilter, setClassFilter] = useState<ManifestClassId | 'all'>('all')
  const [formClassId, setFormClassId] = useState<ManifestClassId>('eco')
  const [adult, setAdult] = useState(1)
  const [child, setChild] = useState(0)
  const [infant, setInfant] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [seatLabel, setSeatLabel] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [bookingRows, setBookingRows] = useState<ManifestPrintRow[]>([])
  const [manualRows, setManualRows] = useState<ManifestPrintRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reloadManual = useCallback((d: string) => {
    const entries = listManifestManualEntries(d)
    setManualRows(
      entries.map((e) => ({
        id: e.id,
        source: 'manual' as const,
        date: e.date,
        classId: e.classId,
        className: e.className,
        firstName: e.firstName,
        lastName: e.lastName,
        adult: e.adult,
        child: e.child,
        infant: e.infant,
        seatLabel: e.seatLabel,
      }))
    )
  }, [])

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      // Sınıf parametresi kasıtlı olarak gönderilmiyor: tüm günü tek seferde
      // çekip sınıf filtresini (segmented control) istemci tarafında
      // uyguluyoruz — böylece "Eco 157 · Premium 70 · First Class 20" gibi
      // sınıf kırılımı, filtre değiştirmeden her zaman doğru gösterilebiliyor.
      const params = new URLSearchParams({ date })
      const res = await fetch(`/api/admin/manifest?${params}`, adminFetchInit({}, { adminEmail }))
      if (!res.ok) throw new Error('Rezervasyonlar yüklenemedi')
      const data = (await res.json()) as {
        bookings: Array<{
          id: string
          date: string
          classId: string
          className: string
          firstName: string
          lastName: string
          adult: number
          child: number
          infant: number
          seatLabel: string
          tourTitle?: string
          totalPrice?: number
          paidNow?: number
          remainingAmount?: number
          currency?: string
          source: 'booking'
        }>
      }
      setBookingRows(
        (data.bookings ?? []).map((b) => ({
          id: b.id,
          source: 'booking' as const,
          date: b.date,
          classId: b.classId,
          className: b.className,
          firstName: b.firstName,
          lastName: b.lastName,
          adult: b.adult,
          child: b.child,
          infant: b.infant,
          seatLabel: b.seatLabel,
          tourTitle: b.tourTitle,
          totalPrice: b.totalPrice,
          paidNow: b.paidNow,
          remainingAmount: b.remainingAmount,
          currency: b.currency,
        }))
      )
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Yükleme hatası')
      setBookingRows([])
    } finally {
      setLoading(false)
    }
  }, [adminEmail, date])

  useEffect(() => {
    reloadManual(date)
  }, [date, reloadManual])

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  /** Günün tamamı, sınıf filtresinden bağımsız — başlık istatistikleri ve
      segmented control'deki sınıf kırılımı için. */
  const dayRows = useMemo(
    () => sortManifestRowsAlphabetically([...bookingRows, ...manualRows]),
    [bookingRows, manualRows]
  )

  const dayTotals = useMemo(() => {
    const pax = dayRows.reduce((sum, r) => sum + paxTotal(r), 0)
    return { count: dayRows.length, pax }
  }, [dayRows])

  const classBreakdown = useMemo(() => {
    const counts: Record<ManifestClassId, number> = { eco: 0, premium: 0, first: 0 }
    for (const r of dayRows) {
      if (r.classId === 'eco' || r.classId === 'premium' || r.classId === 'first') {
        counts[r.classId] += paxTotal(r)
      }
    }
    return counts
  }, [dayRows])

  const allRows = useMemo(() => {
    if (classFilter === 'all') return dayRows
    return dayRows.filter((r) => r.classId === classFilter)
  }, [classFilter, dayRows])

  const totals = useMemo(() => {
    const pax = allRows.reduce((sum, r) => sum + paxTotal(r), 0)
    const paid = allRows.reduce((sum, r) => sum + (r.paidNow ?? 0), 0)
    const remaining = allRows.reduce((sum, r) => sum + (r.remainingAmount ?? 0), 0)
    return { count: allRows.length, pax, paid, remaining }
  }, [allRows])

  const handleAddManual = () => {
    setFormError(null)
    const fn = firstName.trim()
    const ln = lastName.trim()
    if (!fn || !ln) {
      setFormError('Ad ve soyad zorunludur.')
      return
    }
    if (adult + child + infant < 1) {
      setFormError('En az 1 kişi seçin.')
      return
    }
    const classMeta = MANIFEST_CLASS_OPTIONS.find((c) => c.id === formClassId)!
    addManifestManualEntry({
      date,
      classId: formClassId,
      className: classMeta.label,
      adult,
      child,
      infant,
      firstName: fn,
      lastName: ln,
      seatLabel: seatLabel.trim(),
    })
    reloadManual(date)
    setFirstName('')
    setLastName('')
    setSeatLabel('')
    setAdult(1)
    setChild(0)
    setInfant(0)
  }

  const handleRemoveManual = (id: string) => {
    removeManifestManualEntry(id)
    reloadManual(date)
  }

  const handleClearManual = () => {
    if (!window.confirm('Bu tarihteki tüm manuel kayıtlar silinsin mi?')) return
    clearManifestManualEntriesForDate(date)
    reloadManual(date)
  }

  const handlePrint = () => {
    window.print()
  }

  const classFilterLabel =
    classFilter === 'all'
      ? 'Tüm sınıflar'
      : (MANIFEST_CLASS_OPTIONS.find((c) => c.id === classFilter)?.label ?? classFilter)

  return (
    <div className="mx-auto max-w-[1200px] px-3 py-6 sm:px-4 lg:px-6">
      <div className={`${styles.printSheet} rounded-xl border border-[#f1f5f9] bg-white p-4 shadow-[0_2px_8px_rgba(19,23,25,0.06)] sm:p-6`}>
        <div className={`${styles.noPrint} mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`}>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#131719]">Çıktı Listesi</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Sadece ödenen sistem rezervasyonları ve manuel kayıtlar birlikte yazdırılır. Liste soyada göre A–Z sıralıdır.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadBookings()}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-[#131719] hover:bg-zinc-50"
            >
              Yenile
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"
            >
              Yazdır / PDF
            </button>
          </div>
        </div>

        <div className={`${styles.printOnly} mb-4`}>
          <h1 className="text-xl font-bold text-slate-900">Yolcu Çıktı Listesi</h1>
          <p className="text-sm text-slate-700">
            {formatDateLabel(date)} · {classFilterLabel} · {totals.count} kayıt · {totals.pax} kişi · A–Z sıralı
            {totals.paid > 0 || totals.remaining > 0
              ? ` · Kapora: ${formatMoney(totals.paid)} · Kapıda: ${formatMoney(totals.remaining)}`
              : ''}
          </p>
        </div>

        {/* Önceden sol panel ~%25, sağda devasa boş alan vardı. Sol panel artık
            yalnızca tarih + manuel kayıt formuna ayrılan dar bir şerit (~%22);
            günlük operasyon (özet + sınıf kırılımı + yolcu listesi) sağ tarafta
            (~%78) tek bir akışta toplandı. */}
        <div className={`${styles.noPrint} mb-6 grid gap-6 lg:grid-cols-[22fr_78fr]`}>
          <section className="rounded-xl border border-[#f1f5f9] bg-zinc-50 p-4">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-zinc-500">Manuel Kayıt Ekle</h2>

            <div className="mb-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">Tarih</p>
              <AdminBookingMonthCalendar value={date} onChange={setDate} minDate="2020-01-01" />
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">Sınıf</p>
              <div className="flex flex-wrap gap-2">
                {MANIFEST_CLASS_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.classChip} ${formClassId === c.id ? styles.classChipActive : ''}`}
                    onClick={() => setFormClassId(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <CounterField label="Yetişkin" value={adult} onChange={setAdult} min={0} />
              <CounterField label="Çocuk" value={child} onChange={setChild} />
              <CounterField label="Bebek" value={infant} onChange={setInfant} />
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">Ad</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-[#131719] focus:border-primary focus:outline-none"
                  placeholder="Ad"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">Soyad</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-[#131719] focus:border-primary focus:outline-none"
                  placeholder="Soyad"
                />
              </label>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
                Oturacağı Yer
              </span>
              <input
                type="text"
                value={seatLabel}
                onChange={(e) => setSeatLabel(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-[#131719] focus:border-primary focus:outline-none"
                placeholder="Örn: L3, güvertede sağ, masa 2…"
              />
            </label>

            {formError && <p className="mb-3 text-sm font-semibold text-red-600">{formError}</p>}

            <button
              type="button"
              onClick={handleAddManual}
              className="w-full rounded-lg bg-[#131719] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              Listeye Ekle
            </button>
          </section>

          <section>
            {/* Günlük operasyon başlığı: tarih + tüm güne ait toplam yolcu/rezervasyon
                + sınıf kırılımı — seçili filtreden bağımsız, her zaman görünür. */}
            <div className="mb-3">
              <h2 className="text-lg font-black text-[#131719] sm:text-xl">{formatDateLabel(date)}</h2>
              <p className="mt-0.5 text-sm font-semibold text-zinc-600">
                {loading ? 'Yükleniyor…' : `${dayTotals.pax} yolcu · ${dayTotals.count} rezervasyon`}
              </p>
              {!loading && (
                <p className="mt-0.5 text-sm text-zinc-400">
                  {MANIFEST_CLASS_OPTIONS.map((c) => `${c.label} ${classBreakdown[c.id]}`).join(' · ')}
                </p>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={`${styles.filterChip} ${classFilter === 'all' ? styles.filterChipActive : ''}`}
                onClick={() => setClassFilter('all')}
              >
                Tümü {dayTotals.pax}
              </button>
              {MANIFEST_CLASS_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.filterChip} ${classFilter === c.id ? styles.filterChipActive : ''}`}
                  onClick={() => setClassFilter(c.id)}
                >
                  {c.label} {classBreakdown[c.id]}
                </button>
              ))}
            </div>

            {loadError && <p className="mb-3 text-sm font-semibold text-red-600">{loadError}</p>}

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                  Ödenen (sistem): {bookingRows.length}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
                  Manuel: {manualRows.filter((r) => classFilter === 'all' || r.classId === classFilter).length}
                </span>
                <button
                  type="button"
                  onClick={handleClearManual}
                  className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50"
                >
                  Manuel kayıtları temizle
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                {totals.count} kayıt · {totals.pax} kişi · Kapora {formatMoney(totals.paid)} · Kapıda{' '}
                {formatMoney(totals.remaining)}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className={`${styles.printTable} w-full min-w-[800px] border-collapse text-sm`}>
                <thead>
                  <tr className="bg-zinc-50 text-left text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                    <th className="border border-zinc-200 px-3 py-2">#</th>
                    <th className="border border-zinc-200 px-3 py-2">Ad Soyad</th>
                    <th className="border border-zinc-200 px-3 py-2">Sınıf</th>
                    <th className="border border-zinc-200 px-3 py-2">Yetişkin</th>
                    <th className="border border-zinc-200 px-3 py-2">Çocuk</th>
                    <th className="border border-zinc-200 px-3 py-2">Bebek</th>
                    <th className="border border-zinc-200 px-3 py-2">Kişi</th>
                    <th className="border border-zinc-200 px-3 py-2">Ödenen (kapora)</th>
                    <th className="border border-zinc-200 px-3 py-2">Kapıda ödenecek</th>
                    <th className="border border-zinc-200 px-3 py-2">Oturacağı Yer</th>
                    <th className={`${styles.noPrint} border border-zinc-200 px-3 py-2`}>Kaynak</th>
                    <th className={`${styles.noPrint} border border-zinc-200 px-3 py-2`} />
                  </tr>
                </thead>
                <tbody>
                  {allRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="border border-zinc-200 px-3 py-8 text-center text-zinc-400">
                        {loading ? 'Liste yükleniyor…' : 'Bu tarih için kayıt yok.'}
                      </td>
                    </tr>
                  ) : (
                    allRows.map((row, index) => (
                      <tr key={`${row.source}-${row.id}`} className="text-[#131719]">
                        <td className="border border-zinc-200 px-3 py-2">{index + 1}</td>
                        <td className="border border-zinc-200 px-3 py-2 font-bold">
                          {row.firstName} {row.lastName}
                        </td>
                        <td className="border border-zinc-200 px-3 py-2">{row.className}</td>
                        <td className="border border-zinc-200 px-3 py-2 text-center">{row.adult}</td>
                        <td className="border border-zinc-200 px-3 py-2 text-center">{row.child}</td>
                        <td className="border border-zinc-200 px-3 py-2 text-center">{row.infant}</td>
                        <td className="border border-zinc-200 px-3 py-2 text-center font-bold">
                          {paxTotal(row)}
                        </td>
                        <td className="border border-zinc-200 px-3 py-2 text-right font-bold text-primary">
                          {formatMoney(row.paidNow, row.currency)}
                        </td>
                        <td className="border border-zinc-200 px-3 py-2 text-right font-bold text-amber-700">
                          {formatMoney(row.remainingAmount, row.currency)}
                        </td>
                        <td className="border border-zinc-200 px-3 py-2">{row.seatLabel || '—'}</td>
                        <td className={`${styles.noPrint} border border-zinc-200 px-3 py-2`}>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              row.source === 'manual'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-50 text-primary'
                            }`}
                          >
                            {row.source === 'manual' ? 'Manuel' : 'Sistem'}
                          </span>
                        </td>
                        <td className={`${styles.noPrint} border border-zinc-200 px-3 py-2`}>
                          {row.source === 'manual' ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveManual(row.id)}
                              className="text-xs font-bold text-red-600 hover:text-red-700"
                            >
                              Sil
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

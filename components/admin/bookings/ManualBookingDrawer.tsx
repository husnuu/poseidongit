'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TourOption } from '@/types/adminBookings'
import FirstClassSeatSelector from '@/components/booking/FirstClassSeatSelector'
import MealOptionSelect from '@/components/booking/steps/MealOptionSelect'
import bookingFieldStyles from '@/components/booking/booking.module.css'

const MANUAL_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'physical', label: 'Fiziksel satış' },
  { value: 'office', label: 'Ofis' },
  { value: 'phone', label: 'Telefon' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'agency', label: 'Acente' },
  { value: 'other', label: 'Diğer' },
]

const STATUS_OPTIONS: { value: 'pending' | 'paid' | 'cancelled'; label: string }[] = [
  { value: 'paid', label: 'Ödendi' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'cancelled', label: 'İptal' },
]

interface TourClass {
  id: string
  label: string
}

interface AdminTourMealMenu {
  enabled: boolean
  sectionTitle?: string
  description?: string
  options: { key: string; label: string }[]
}

interface CapacityInfo {
  capacity: number
  booked: number
  remaining: number
}

import { adminFetchInit } from '@/lib/adminRequestInit'
import AdminBookingMonthCalendar from '@/components/admin/bookings/AdminBookingMonthCalendar'

function AgentFormSection({
  standalone,
  title,
  children,
}: {
  standalone: boolean
  title: string
  children: React.ReactNode
}) {
  if (!standalone) return <>{children}</>
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-5">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

interface ManualBookingDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  tours: TourOption[]
  /** Boşsa yalnızca admin oturum çerezi (credentials) kullanılır. */
  authToken: string
  adminEmail?: string
  /** Tam sayfa modu (biletçi/acente): liste yok, sadece form */
  standalone?: boolean
  onLogout?: () => void
}

export default function ManualBookingDrawer({
  open,
  onClose,
  onSuccess,
  tours,
  authToken,
  adminEmail,
  standalone = false,
  onLogout,
}: ManualBookingDrawerProps) {
  const [tourId, setTourId] = useState('')
  const [tourTitle, setTourTitle] = useState('')
  const [tourClasses, setTourClasses] = useState<TourClass[]>([])
  const [date, setDate] = useState('')
  const [classId, setClassId] = useState('')
  const [className, setClassName] = useState('')
  const [adult, setAdult] = useState(1)
  const [child, setChild] = useState(0)
  const [infant, setInfant] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [unitPrice, setUnitPrice] = useState(0)
  const [totalPriceOverride, setTotalPriceOverride] = useState<number | null>(null)
  const [currency, setCurrency] = useState('TRY')
  const [status, setStatus] = useState<'pending' | 'paid' | 'cancelled'>('paid')
  const [manualSource, setManualSource] = useState('physical')
  const [adminNote, setAdminNote] = useState('')
  const [sendVoucher, setSendVoucher] = useState(false)
  const [sendEmail, setSendEmail] = useState(false)
  const [sendEmailToAdmin, setSendEmailToAdmin] = useState(false)
  const [capacityInfo, setCapacityInfo] = useState<CapacityInfo | null>(null)
  const [capacityLoading, setCapacityLoading] = useState(false)
  const [classesLoading, setClassesLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [capacityExceeded, setCapacityExceeded] = useState(false)
  const [forceCreate, setForceCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  /** First Class seçildiğinde seçilen localar (L1–L10). */
  const [firstClassLocas, setFirstClassLocas] = useState<string[]>([])
  /** Seçilen tarih için başka rezervasyonlarda dolu loca id'leri (availability API'den). */
  const [reservedLocaIds, setReservedLocaIds] = useState<string[]>([])
  const [mealMenu, setMealMenu] = useState<AdminTourMealMenu | null>(null)
  const [mealPreferenceKey, setMealPreferenceKey] = useState('')
  const [mealCountsByKey, setMealCountsByKey] = useState<Record<string, number>>({})

  const totalPax = adult + child + infant
  const isFirstClass = !!classId && (classId.toLowerCase().startsWith('first') || tourClasses.find((c) => c.id === classId)?.label?.toLowerCase().includes('first'))
  const requiredLocas = isFirstClass ? Math.ceil(totalPax / 2) : 0
  const computedTotal = unitPrice * totalPax
  const totalPrice = totalPriceOverride !== null ? totalPriceOverride : (unitPrice ? computedTotal : 0)

  const fetchClasses = useCallback(async () => {
    if (!tourId) {
      setTourClasses([])
      setTourTitle('')
      setClassId('')
      setClassName('')
      return
    }
    setClassesLoading(true)
    try {
      const res = await fetch(
        `/api/admin/tour-classes?tourId=${encodeURIComponent(tourId)}`,
        adminFetchInit({}, { bearerToken: authToken.trim() || null, adminEmail: adminEmail ?? null })
      )
      const data = await res.json()
      if (res.ok) {
        const classes = data.classes?.length ? data.classes : [
          { id: 'eco', label: 'Eco' },
          { id: 'premium', label: 'Premium' },
          { id: 'first', label: 'First' },
        ]
        setTourClasses(classes)
        setTourTitle(data.tourTitle || '')
        setMealPreferenceKey('')
        setMealCountsByKey({})
        const mm = data.mealMenu as AdminTourMealMenu | undefined
        if (mm?.enabled && Array.isArray(mm.options) && mm.options.length > 0) {
          setMealMenu(mm)
        } else {
          setMealMenu(null)
        }
        if (classes[0]) {
          setClassId(classes[0].id)
          setClassName(classes[0].label || classes[0].id)
        }
      } else {
        setTourClasses([])
        setClassId('')
        setClassName('')
        setMealMenu(null)
        setMealPreferenceKey('')
        setMealCountsByKey({})
      }
    } catch {
      setTourClasses([])
      setMealMenu(null)
      setMealPreferenceKey('')
      setMealCountsByKey({})
    } finally {
      setClassesLoading(false)
    }
  }, [tourId, authToken, adminEmail])

  useEffect(() => {
    if (open && tourId) fetchClasses()
    else if (!tourId) setTourClasses([])
  }, [open, tourId, fetchClasses])

  useEffect(() => {
    if (!tourId || !date) {
      setCapacityInfo(null)
      setReservedLocaIds([])
      return
    }
    let cancelled = false
    setCapacityLoading(true)
    setCapacityInfo(null)
    const normKey = !classId ? 'eco' : classId.toLowerCase().startsWith('prem') ? 'premium' : classId.toLowerCase().startsWith('first') ? 'first' : 'eco'
    fetch(`/api/availability?tourId=${encodeURIComponent(tourId)}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const cls = data.classes?.[normKey] ?? data.classes?.[classId] ?? data.classes?.eco
        if (cls) {
          setCapacityInfo({
            capacity: cls.capacity ?? 0,
            booked: cls.booked ?? 0,
            remaining: cls.remaining ?? 0,
          })
        } else {
          setCapacityInfo(null)
        }
        setReservedLocaIds(Array.isArray(data.firstClassLocasReserved) ? data.firstClassLocasReserved : [])
      })
      .catch(() => {
        if (!cancelled) {
          setCapacityInfo(null)
          setReservedLocaIds([])
        }
      })
      .finally(() => {
        if (!cancelled) setCapacityLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tourId, date, classId])

  useEffect(() => {
    if (tourClasses.length && classId) {
      const c = tourClasses.find((x) => x.id === classId)
      if (c) setClassName(c.label || c.id)
    }
  }, [classId, tourClasses])

  // First Class değilse veya tarih değişince loca seçimini sıfırla
  useEffect(() => {
    if (!isFirstClass || !date) setFirstClassLocas([])
  }, [isFirstClass, date, classId])

  useEffect(() => {
    if (mealMenu?.enabled && mealMenu.options.length === 1) {
      setMealPreferenceKey(mealMenu.options[0].key)
    }
  }, [mealMenu])

  useEffect(() => {
    if (!mealMenu?.enabled || mealMenu.options.length === 0) {
      setMealCountsByKey({})
      return
    }
    setMealCountsByKey((prev) => {
      const next: Record<string, number> = {}
      for (const opt of mealMenu.options) {
        const curr = Math.max(0, Number(prev[opt.key] ?? 0) || 0)
        if (curr > 0) next[opt.key] = curr
      }
      return next
    })
  }, [mealMenu?.enabled, mealMenu?.options])

  const exceedsCapacity = capacityInfo ? totalPax > capacityInfo.remaining : false

  const resetForm = useCallback(() => {
    setTourId('')
    setTourTitle('')
    setTourClasses([])
    setDate('')
    setClassId('')
    setClassName('')
    setAdult(1)
    setChild(0)
    setInfant(0)
    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setUnitPrice(0)
    setTotalPriceOverride(null)
    setCurrency('TRY')
    setStatus('paid')
    setManualSource('physical')
    setAdminNote('')
    setSendVoucher(false)
    setSendEmail(false)
    setSendEmailToAdmin(false)
    setSubmitError(null)
    setCapacityExceeded(false)
    setForceCreate(false)
    setSuccessMessage(null)
    setFirstClassLocas([])
    setReservedLocaIds([])
    setMealMenu(null)
    setMealPreferenceKey('')
    setMealCountsByKey({})
  }, [])

  const handleSubmit = async (andNew: boolean) => {
    setSubmitError(null)
    setCapacityExceeded(false)
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setSubmitError('Ad, soyad ve telefon zorunludur.')
      return
    }
    if (!tourId || !tourTitle || !date || !classId || !className) {
      setSubmitError('Tur, tarih ve sınıf seçin.')
      return
    }
    if (totalPax < 1) {
      setSubmitError('En az 1 kişi girin.')
      return
    }
    if (exceedsCapacity && !forceCreate) {
      setCapacityExceeded(true)
      setSubmitError(`Kalan kapasite ${capacityInfo?.remaining ?? 0} kişi. Yine de kaydetmek için onaylayın.`)
      return
    }
    if (isFirstClass && requiredLocas > 0 && (firstClassLocas?.length ?? 0) < requiredLocas) {
      setSubmitError(`First Class için ${requiredLocas} loca seçin (${totalPax} kişi → ${requiredLocas} loca).`)
      return
    }
    if (mealMenu?.enabled && mealMenu.options.length > 0) {
      const selectedMealTotal = mealMenu.options.reduce(
        (sum, opt) => sum + Math.max(0, Number(mealCountsByKey[opt.key] ?? 0) || 0),
        0
      )
      if (selectedMealTotal !== totalPax) {
        setSubmitError(`Yemek dağılımı toplamı ${totalPax} olmalı. (Şu an: ${selectedMealTotal})`)
        return
      }
    }
    setSaving(true)
    try {
      const res = await fetch(
        '/api/admin/bookings/manual',
        adminFetchInit(
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
          tourId,
          tourTitle,
          date,
          classId,
          className,
          counts: { adult, child, infant },
          customer: { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(), email: email.trim() },
          unitPrice,
          totalPrice,
          currency,
          status,
          manualSource,
          adminNote: adminNote.trim() || undefined,
          forceCreate: exceedsCapacity && forceCreate,
          sendVoucher,
          sendEmail,
          sendEmailToAdmin,
          ...(isFirstClass && (firstClassLocas?.length ?? 0) > 0 && { firstClassLocas: firstClassLocas!.map((id) => id.trim().toUpperCase()) }),
          ...(mealMenu?.enabled && mealMenu.options.length > 0
            ? {
                mealPreference: {
                  counts: mealMenu.options.reduce((acc, opt) => {
                    const count = Math.max(0, Number(mealCountsByKey[opt.key] ?? 0) || 0)
                    if (count > 0) acc[opt.key] = count
                    return acc
                  }, {} as Record<string, number>),
                },
              }
            : mealPreferenceKey.trim()
            ? { mealPreference: { key: mealPreferenceKey.trim() } }
            : {}),
            }),
          },
          { bearerToken: authToken.trim() || null, adminEmail: adminEmail ?? null }
        )
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.error === 'capacity_exceeded') {
          setCapacityExceeded(true)
          setSubmitError(data.message || 'Kapasite aşıldı.')
        } else {
          setSubmitError(data.error || 'Kayıt oluşturulamadı.')
        }
        return
      }
      setSuccessMessage('Rezervasyon kaydedildi.')
      onSuccess()
      if (andNew) {
        resetForm()
      } else {
        setTimeout(() => onClose(), 1200)
      }
    } catch {
      setSubmitError('Bağlantı hatası.')
    } finally {
      setSaving(false)
    }
  }

  if (!open && !standalone) return null

  const inp = standalone
    ? 'min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15 disabled:bg-slate-50'
    : 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900'
  const lbl = standalone
    ? 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500'
    : 'mb-1 block text-sm font-medium text-zinc-700'
  const ta = standalone
    ? `${inp} min-h-[92px] resize-y py-3`
    : 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900'

  const wrapperClass = standalone
    ? 'flex max-h-[min(100dvh-3.5rem,calc(100vh-3.5rem))] min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.07]'
    : 'fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-xl'
  const headerContent = (
    <div
      className={
        standalone
          ? 'flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-4 py-4 text-white sm:px-5 sm:py-4'
          : 'flex items-center justify-between border-b border-slate-200/80 px-5 py-4'
      }
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={standalone ? 'truncate text-lg font-bold tracking-tight sm:text-xl' : 'text-lg font-semibold text-slate-800'}>
            {standalone ? 'Yeni rezervasyon' : '+ Manuel Rezervasyon Ekle'}
          </h3>
          {standalone && (
            <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 ring-1 ring-white/25">
              Biletçi
            </span>
          )}
        </div>
        {standalone && <p className="mt-1 text-xs text-white/70 sm:text-sm">Tur, misafir ve ödeme bilgilerini girin</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className={
              standalone
                ? 'rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-[0.98] sm:px-4'
                : 'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }
          >
            Çıkış
          </button>
        )}
        {!standalone && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )

  const formOuterClass = standalone ? 'space-y-5' : 'space-y-4'
  const chkRow = standalone
    ? 'flex min-h-[48px] cursor-pointer items-start gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm transition hover:border-teal-300/50 active:bg-slate-50/80'
    : 'flex items-center gap-2'
  const mealBox = standalone
    ? 'rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm'
    : 'rounded-lg border border-zinc-200 bg-white px-3 py-2'

  return (
    <>
      {!standalone && <div className="fixed inset-0 z-40 bg-zinc-900/30" aria-hidden onClick={onClose} />}
      <div
        className={wrapperClass}
        role={standalone ? 'main' : 'dialog'}
        aria-modal={!standalone}
        aria-label="Manuel rezervasyon ekle"
      >
        {headerContent}
        <div
          className={
            standalone
              ? 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-4 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4'
              : 'flex-1 overflow-y-auto p-4'
          }
        >
          {successMessage && (
            <div
              className={
                standalone
                  ? 'mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3.5 text-sm font-medium text-emerald-900 shadow-sm'
                  : 'mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800'
              }
              role="status"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden>
                ✓
              </span>
              {successMessage}
            </div>
          )}
          {submitError && (
            <div
              className={
                standalone
                  ? 'mb-4 rounded-2xl border border-red-200/90 bg-red-50/95 px-4 py-3.5 text-sm text-red-900 shadow-sm'
                  : 'mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800'
              }
              role="alert"
            >
              {submitError}
              {capacityExceeded && (
                <button
                  type="button"
                  onClick={() => setForceCreate(true)}
                  className="ml-2 font-semibold text-red-800 underline decoration-red-400 underline-offset-2 hover:text-red-950"
                >
                  Yine de kaydet
                </button>
              )}
            </div>
          )}

          <div className={formOuterClass}>
            <AgentFormSection standalone={standalone} title="Tur ve sınıf">
              <div>
                <label className={lbl}>Tur *</label>
                <select value={tourId} onChange={(e) => setTourId(e.target.value)} className={inp} required>
                  <option value="">Seçin</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className={standalone ? 'sm:col-span-2' : ''}>
                  <label className={lbl}>Tarih *</label>
                  {standalone ? (
                    <div className="mt-1.5">
                      <AdminBookingMonthCalendar
                        value={date}
                        onChange={setDate}
                        disabled={!tourId}
                        variant="biletci"
                      />
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inp}
                      required
                    />
                  )}
                </div>
                <div>
                  <label className={lbl}>Sınıf *</label>
                  <select
                    value={classId}
                    onChange={(e) => {
                      const c = tourClasses.find((x) => x.id === e.target.value)
                      setClassId(e.target.value)
                      setClassName(c?.label ?? e.target.value)
                    }}
                    className={inp}
                    disabled={classesLoading}
                  >
                    <option value="">Seçin</option>
                    {tourClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </AgentFormSection>

            {mealMenu?.enabled && mealMenu.options.length > 0 && (
              <AgentFormSection standalone={standalone} title="Yemek tercihi">
                <div>
                  <p className={standalone ? 'mb-2 text-sm font-medium text-slate-700' : bookingFieldStyles.formLabel}>
                    {mealMenu.sectionTitle?.trim() || 'Yemek tercihi'} *
                  </p>
                  {mealMenu.description?.trim() ? (
                    <p className={bookingFieldStyles.mealOptionDescription}>{mealMenu.description.trim()}</p>
                  ) : null}
                  <MealOptionSelect
                    options={mealMenu.options}
                    value={mealPreferenceKey}
                    onChange={setMealPreferenceKey}
                    ariaLabel={mealMenu.sectionTitle?.trim() || 'Yemek tercihi'}
                    namePrefix="manual-booking-meal"
                    showError={false}
                  />
                  <div className={standalone ? 'mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2' : 'mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2'}>
                    {mealMenu.options.map((opt) => (
                      <label key={opt.key} className={mealBox}>
                        <span className="block text-xs font-semibold text-slate-600">{opt.label}</span>
                        <input
                          type="number"
                          min={0}
                          value={mealCountsByKey[opt.key] ?? 0}
                          onChange={(e) => {
                            const n = Math.max(0, parseInt(e.target.value, 10) || 0)
                            setMealCountsByKey((prev) => ({ ...prev, [opt.key]: n }))
                          }}
                          className={standalone ? `${inp} mt-2 min-h-[44px]` : 'mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm'}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Toplam seçilen:{' '}
                    {mealMenu.options.reduce(
                      (sum, opt) => sum + Math.max(0, Number(mealCountsByKey[opt.key] ?? 0) || 0),
                      0
                    )}{' '}
                    / {totalPax}
                  </p>
                </div>
              </AgentFormSection>
            )}

            {isFirstClass && date && (
              <AgentFormSection standalone={standalone} title="First Class loca">
                <div
                  className={
                    standalone
                      ? 'rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-white p-1 sm:p-2'
                      : 'rounded-xl border border-stone-200/80 bg-gradient-to-b from-white to-stone-50/30 p-4 shadow-sm'
                  }
                >
                  {!standalone && <h4 className="mb-3 text-sm font-semibold text-zinc-800">Loca Seçimi (First Class)</h4>}
                  <FirstClassSeatSelector
                    selectedLocaIds={firstClassLocas}
                    reservedLocaIds={reservedLocaIds}
                    requiredCount={requiredLocas}
                    onToggle={(locaId) => {
                      const id = locaId.trim().toUpperCase()
                      if (firstClassLocas.includes(id)) {
                        setFirstClassLocas(firstClassLocas.filter((x) => x !== id))
                      } else if (firstClassLocas.length < requiredLocas) {
                        setFirstClassLocas([...firstClassLocas, id])
                      }
                    }}
                    onReplace={(removeId, addId) => {
                      setFirstClassLocas([
                        ...firstClassLocas.filter((x) => x !== removeId.trim().toUpperCase()),
                        addId.trim().toUpperCase(),
                      ])
                    }}
                    aria-label="First Class loca seçimi"
                  />
                </div>
              </AgentFormSection>
            )}

            <AgentFormSection standalone={standalone} title="Misafirler ve kontenjan">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className={lbl}>Yetişkin *</label>
                  <input
                    type="number"
                    min={0}
                    value={adult}
                    onChange={(e) => setAdult(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Çocuk</label>
                  <input
                    type="number"
                    min={0}
                    value={child}
                    onChange={(e) => setChild(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Bebek</label>
                  <input
                    type="number"
                    min={0}
                    value={infant}
                    onChange={(e) => setInfant(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className={inp}
                  />
                </div>
              </div>
              <p className={standalone ? 'text-sm font-medium text-slate-600' : 'text-sm text-zinc-500'}>
                Toplam: <span className="text-slate-900">{totalPax}</span> kişi
              </p>

              {capacityInfo && (
                <div
                  className={
                    standalone
                      ? `flex flex-col gap-2 rounded-2xl border p-4 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${
                          exceedsCapacity && !forceCreate
                            ? 'border-red-300/90 bg-red-50/90'
                            : 'border-slate-200/90 bg-slate-100/60'
                        }`
                      : `rounded-lg border p-3 text-sm ${
                          exceedsCapacity && !forceCreate ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50'
                        }`
                  }
                >
                  <div>
                    <p className="font-semibold text-slate-800">Kontenjan</p>
                    <p className="mt-1 text-slate-600">
                      Kapasite <strong>{capacityInfo.capacity}</strong> · Dolu{' '}
                      <strong>{capacityInfo.booked}</strong> · Kalan <strong>{capacityInfo.remaining}</strong>
                    </p>
                  </div>
                  {standalone && (
                    <span
                      className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold ${
                        exceedsCapacity && !forceCreate ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'
                      }`}
                    >
                      {capacityInfo.remaining} yer
                    </span>
                  )}
                  {exceedsCapacity && !forceCreate && (
                    <p className="w-full text-sm font-semibold text-red-700 sm:mt-0">Bu kayıt kalan kapasiteyi aşıyor.</p>
                  )}
                </div>
              )}
              {capacityLoading && tourId && date && (
                <p className="text-sm text-slate-500">Kontenjan yükleniyor…</p>
              )}
            </AgentFormSection>

            <AgentFormSection standalone={standalone} title="Müşteri">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Ad *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inp}
                    placeholder="Ad"
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className={lbl}>Soyad *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inp}
                    placeholder="Soyad"
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>Telefon *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inp}
                  placeholder="+90 …"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className={lbl}>E-posta (opsiyonel)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inp}
                  placeholder="musteri@ornek.com"
                  autoComplete="email"
                />
              </div>
            </AgentFormSection>

            <AgentFormSection standalone={standalone} title="Fiyat">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Birim fiyat (opsiyonel)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={unitPrice || ''}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className={inp}
                    placeholder="Boş bırakılabilir"
                  />
                </div>
                <div>
                  <label className={lbl}>Toplam (opsiyonel)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={totalPriceOverride !== null ? totalPriceOverride : unitPrice ? computedTotal : ''}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '') setTotalPriceOverride(null)
                      else setTotalPriceOverride(parseFloat(v) || 0)
                    }}
                    className={inp}
                    placeholder="Otomatik: birim × kişi"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">Boş bırakılırsa toplam hesaplanmaz · Birim × {totalPax}</p>
                </div>
              </div>
              <div>
                <label className={lbl}>Para birimi</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inp}>
                  <option value="TRY">TRY</option>
                </select>
              </div>
            </AgentFormSection>

            <AgentFormSection standalone={standalone} title="Ödeme ve kaynak">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Ödeme durumu *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'pending' | 'paid' | 'cancelled')}
                    className={inp}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Kaynak *</label>
                  <select value={manualSource} onChange={(e) => setManualSource(e.target.value)} className={inp}>
                    {MANUAL_SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Admin notu</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className={ta}
                  placeholder="İç not (isteğe bağlı)"
                />
              </div>
            </AgentFormSection>

            <AgentFormSection standalone={standalone} title="Bildirimler">
              <div className="space-y-2">
                <label className={chkRow}>
                  <input
                    type="checkbox"
                    checked={sendVoucher}
                    onChange={(e) => setSendVoucher(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={standalone ? 'text-sm font-medium text-slate-700' : 'text-sm text-zinc-700'}>
                    Voucher gönder (isteğe bağlı)
                  </span>
                </label>
                <label className={chkRow}>
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={standalone ? 'text-sm font-medium text-slate-700' : 'text-sm text-zinc-700'}>
                    Müşteriye e-posta (ödendi ise)
                  </span>
                </label>
                <label className={chkRow}>
                  <input
                    type="checkbox"
                    checked={sendEmailToAdmin}
                    onChange={(e) => setSendEmailToAdmin(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={standalone ? 'text-sm font-medium text-slate-700' : 'text-sm text-zinc-700'}>
                    Yöneticiye bilgi e-postası
                  </span>
                </label>
              </div>
            </AgentFormSection>
          </div>
        </div>
        <div
          className={
            standalone
              ? 'sticky bottom-0 z-20 flex shrink-0 flex-col gap-2 border-t border-slate-200/90 bg-white/95 p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 sm:flex-row sm:items-stretch sm:justify-center sm:gap-3 sm:p-4'
              : 'flex gap-2 border-t border-zinc-200 p-4'
          }
        >
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className={
              standalone
                ? 'min-h-[48px] w-full rounded-2xl bg-teal-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-50 sm:max-w-md sm:flex-1'
                : 'min-w-[200px] flex-1 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50'
            }
          >
            {saving ? 'Kaydediliyor…' : standalone ? 'Kaydet ve yeni kayıt' : 'Kaydet ve yeni kayıda geç'}
          </button>
          {!standalone && (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="flex-1 rounded-lg border border-zinc-300 bg-white py-2.5 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Kaydet ve kapat
            </button>
          )}
        </div>
      </div>
    </>
  )
}

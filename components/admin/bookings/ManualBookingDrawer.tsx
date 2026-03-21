'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TourOption } from '@/types/adminBookings'
import FirstClassSeatSelector from '@/components/booking/FirstClassSeatSelector'

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

interface CapacityInfo {
  capacity: number
  booked: number
  remaining: number
}

const ADMIN_EMAIL_HEADER = 'X-Admin-Email'

interface ManualBookingDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  tours: TourOption[]
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

  const totalPax = adult + child + infant
  const isFirstClass = !!classId && (classId.toLowerCase().startsWith('first') || tourClasses.find((c) => c.id === classId)?.label?.toLowerCase().includes('first'))
  const requiredLocas = isFirstClass ? Math.ceil(totalPax / 2) : 0
  const computedTotal = unitPrice * totalPax
  const totalPrice = totalPriceOverride !== null ? totalPriceOverride : (unitPrice ? computedTotal : 0)

  const fetchClasses = useCallback(async () => {
    if (!tourId || !authToken) {
      setTourClasses([])
      setTourTitle('')
      setClassId('')
      setClassName('')
      return
    }
    setClassesLoading(true)
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${authToken}` }
      if (adminEmail) headers[ADMIN_EMAIL_HEADER] = adminEmail
      const res = await fetch(`/api/admin/tour-classes?tourId=${encodeURIComponent(tourId)}`, { headers })
      const data = await res.json()
      if (res.ok) {
        const classes = data.classes?.length ? data.classes : [
          { id: 'eco', label: 'Eco' },
          { id: 'premium', label: 'Premium' },
          { id: 'first', label: 'First' },
        ]
        setTourClasses(classes)
        setTourTitle(data.tourTitle || '')
        if (classes[0]) {
          setClassId(classes[0].id)
          setClassName(classes[0].label || classes[0].id)
        }
      } else {
        setTourClasses([])
        setClassId('')
        setClassName('')
      }
    } catch {
      setTourClasses([])
    } finally {
      setClassesLoading(false)
    }
  }, [tourId, authToken, adminEmail])

  useEffect(() => {
    if (open && tourId) fetchClasses()
    else if (!tourId) setTourClasses([])
  }, [open, tourId, fetchClasses])

  useEffect(() => {
    if (!tourId || !date || !authToken) {
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
  }, [tourId, date, classId, authToken])

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
    setSaving(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      }
      if (adminEmail) headers[ADMIN_EMAIL_HEADER] = adminEmail
      const res = await fetch('/api/admin/bookings/manual', {
        method: 'POST',
        headers,
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
        }),
      })
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

  const wrapperClass = standalone
    ? 'flex flex-col bg-white'
    : 'fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-xl'
  const headerContent = (
    <div className={`flex items-center justify-between border-b border-slate-200/80 px-5 py-4 ${standalone ? 'bg-slate-50/80' : ''}`}>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-800">
          {standalone ? 'Manuel rezervasyon' : '+ Manuel Rezervasyon Ekle'}
        </h3>
        {standalone && (
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            Biletçi
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800"
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
        <div className={`flex-1 overflow-y-auto ${standalone ? 'p-6' : 'p-4'}`}>
          {successMessage && (
            <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
              {successMessage}
            </div>
          )}
          {submitError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              {submitError}
              {capacityExceeded && (
                <button
                  type="button"
                  onClick={() => setForceCreate(true)}
                  className="ml-2 font-medium underline"
                >
                  Yine de kaydet
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Tur *</label>
              <select
                value={tourId}
                onChange={(e) => setTourId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                required
              >
                <option value="">Seçin</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Tarih *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Sınıf *</label>
              <select
                value={classId}
                onChange={(e) => {
                  const c = tourClasses.find((x) => x.id === e.target.value)
                  setClassId(e.target.value)
                  setClassName(c?.label ?? e.target.value)
                }}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
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

            {isFirstClass && date && (
              <div className="rounded-xl border border-stone-200/80 bg-gradient-to-b from-white to-stone-50/30 p-4 shadow-sm">
                <h4 className="mb-3 text-sm font-semibold text-zinc-800">Loca Seçimi (First Class)</h4>
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
                    setFirstClassLocas([...firstClassLocas.filter((x) => x !== removeId.trim().toUpperCase()), addId.trim().toUpperCase()])
                  }}
                  aria-label="First Class loca seçimi"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Yetişkin *</label>
                <input
                  type="number"
                  min={0}
                  value={adult}
                  onChange={(e) => setAdult(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Çocuk</label>
                <input
                  type="number"
                  min={0}
                  value={child}
                  onChange={(e) => setChild(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Bebek</label>
                <input
                  type="number"
                  min={0}
                  value={infant}
                  onChange={(e) => setInfant(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                />
              </div>
            </div>
            <p className="text-sm text-zinc-500">Toplam: {totalPax} kişi</p>

            {capacityInfo && (
              <div className={`rounded-lg border p-3 text-sm ${exceedsCapacity && !forceCreate ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50'}`}>
                <p className="font-medium text-zinc-700">Kapasite</p>
                <p>Toplam: {capacityInfo.capacity} · Satılan: {capacityInfo.booked} · Kalan: {capacityInfo.remaining}</p>
                {exceedsCapacity && !forceCreate && (
                  <p className="mt-1 font-medium text-red-600">Bu rezervasyon kalan kapasiteyi aşıyor.</p>
                )}
              </div>
            )}
            {capacityLoading && tourId && date && <p className="text-sm text-zinc-500">Kapasite yükleniyor…</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Ad *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  placeholder="Müşteri adı"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Soyad *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  placeholder="Müşteri soyadı"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Telefon *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                placeholder="Telefon"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">E-posta (opsiyonel)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                placeholder="E-posta"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Birim fiyat (opsiyonel)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={unitPrice || ''}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  placeholder="Boş bırakılırsa: Fiyat belirtilmedi"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Toplam tutar (opsiyonel)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={totalPriceOverride !== null ? totalPriceOverride : (unitPrice ? computedTotal : '')}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') setTotalPriceOverride(null)
                    else setTotalPriceOverride(parseFloat(v) || 0)
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  placeholder="Fiyat belirtilmedi"
                />
                <p className="mt-0.5 text-xs text-zinc-500">Boş = Fiyat belirtilmedi · Otomatik: birim × {totalPax} kişi</p>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Para birimi</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              >
                <option value="TRY">TRY</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Ödeme durumu *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pending' | 'paid' | 'cancelled')}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Rezervasyon kaynağı *</label>
              <select
                value={manualSource}
                onChange={(e) => setManualSource(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              >
                {MANUAL_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Admin notu</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                placeholder="İç not"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendVoucher}
                  onChange={(e) => setSendVoucher(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-700">Voucher gönderme (isteğe bağlı)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-700">Müşteriye e-posta gönder (isteğe bağlı, ödendi ise)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendEmailToAdmin}
                  onChange={(e) => setSendEmailToAdmin(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-700">Admin'e de e-posta gönder (isteğe bağlı)</span>
              </label>
            </div>
          </div>
        </div>
        <div className={`flex gap-2 border-t border-zinc-200 p-4 ${standalone ? 'justify-center' : ''}`}>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 min-w-[200px]"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet ve yeni kayıda geç'}
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

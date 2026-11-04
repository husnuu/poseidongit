'use client'

import { useState } from 'react'
import { slugify } from '@/lib/i18n/slugify'

export type PartnerFormValues = {
  name: string
  slug: string
  type: string
  email: string
  commissionRate: number
  logoData: string | null
  welcomeMessage: string
  contactName: string
  contactPhone: string
  adminNote: string
  password: string
}

/** Yeni partnerin giriş bilgileri, oluşturma ile detay sayfası arasında sessionStorage'da taşınır. */
export const PARTNER_NEW_CREDENTIALS_KEY = 'poseidon_new_partner_credentials'

export const EMPTY_PARTNER_FORM: PartnerFormValues = {
  name: '',
  slug: '',
  type: 'hotel',
  email: '',
  commissionRate: 10,
  logoData: null,
  welcomeMessage: '',
  contactName: '',
  contactPhone: '',
  adminNote: '',
  password: '',
}

const inputClass = 'mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary'
const labelClass = 'text-xs font-bold text-zinc-600'

function generatePassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(crypto.getRandomValues(new Uint32Array(12)), (n) => alphabet[n % alphabet.length]).join('')
}

/** Logo veritabanında tutulduğu için tarayıcıda 256 px'e küçültülür. */
function resizeLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 256 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Görsel okunamadı'))
    }
    img.src = url
  })
}

export default function PartnerAdminForm({
  initial,
  mode,
  submitLabel,
  onSubmit,
}: {
  initial: PartnerFormValues
  mode: 'create' | 'edit'
  submitLabel: string
  onSubmit: (values: PartnerFormValues) => Promise<string | null>
}) {
  const [values, setValues] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof PartnerFormValues>(key: K, value: PartnerFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const handleLogo = async (file: File | undefined) => {
    if (!file) return
    try {
      set('logoData', await resizeLogo(file))
    } catch {
      setError('Logo okunamadı.')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(null)
    const err = await onSubmit(values)
    setSaving(false)
    if (err) setError(err)
    else {
      setSaved('Kaydedildi.')
      set('password', '')
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className={labelClass}>
        İşletme adı
        <input
          required
          value={values.name}
          onChange={(e) => {
            const name = e.target.value
            setValues((v) => ({ ...v, name, ...(mode === 'create' && !slugTouched ? { slug: slugify(name, 'tr') } : {}) }))
          }}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Bağlantı adı (/p/…)
        <input
          required
          disabled={mode === 'edit'}
          title={mode === 'edit' ? 'QR kodlar basıldığı için değiştirilemez' : undefined}
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true)
            set('slug', e.target.value.toLowerCase())
          }}
          className={`${inputClass} disabled:bg-zinc-50 disabled:text-zinc-500`}
        />
      </label>
      <label className={labelClass}>
        Tür
        <select value={values.type} onChange={(e) => set('type', e.target.value)} className={inputClass}>
          <option value="hotel">Otel</option>
          <option value="pension">Pansiyon</option>
          <option value="agency">Acente</option>
          <option value="other">Diğer</option>
        </select>
      </label>
      <label className={labelClass}>
        Komisyon oranı (%)
        <input type="number" required min={0} max={100} step={0.5} value={values.commissionRate} onChange={(e) => set('commissionRate', Number(e.target.value))} className={inputClass} />
      </label>
      <label className={labelClass}>
        Giriş e-postası
        <input type="email" required value={values.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
      </label>
      <label className={labelClass}>
        {mode === 'create' ? 'Şifre' : 'Yeni şifre (boş bırakılırsa değişmez)'}
        <div className="flex gap-2">
          <input
            required={mode === 'create'}
            minLength={8}
            value={values.password}
            onChange={(e) => set('password', e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
          <button type="button" onClick={() => set('password', generatePassword())} className="mt-1 shrink-0 rounded-md border border-zinc-200 px-2.5 text-xs font-bold hover:bg-zinc-50">
            Üret
          </button>
        </div>
      </label>
      <label className={labelClass}>
        Yetkili kişi
        <input value={values.contactName} onChange={(e) => set('contactName', e.target.value)} className={inputClass} />
      </label>
      <label className={labelClass}>
        Yetkili telefonu
        <input value={values.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} className={inputClass} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Mini sayfa karşılama yazısı (boşsa “Misafirlerimize özel Çeşme deneyimleri”)
        <input maxLength={200} value={values.welcomeMessage} onChange={(e) => set('welcomeMessage', e.target.value)} className={inputClass} />
      </label>
      <div className={`${labelClass} sm:col-span-2`}>
        Logo
        <div className="mt-1 flex items-center gap-3">
          {values.logoData && (
            // eslint-disable-next-line @next/next/no-img-element -- yerel önizleme
            <img src={values.logoData} alt="" className="h-12 w-12 rounded border border-zinc-200 object-contain" />
          )}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void handleLogo(e.target.files?.[0])} className="min-w-0 text-xs" />
          {values.logoData && (
            <button type="button" onClick={() => set('logoData', null)} className="text-xs font-bold text-red-600">Kaldır</button>
          )}
        </div>
      </div>
      <label className={`${labelClass} sm:col-span-2`}>
        Admin notu (partner görmez)
        <textarea rows={2} value={values.adminNote} onChange={(e) => set('adminNote', e.target.value)} className={inputClass} />
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-red-600 sm:col-span-2">{error}</p>}
      {saved && <p role="status" className="text-sm font-semibold text-emerald-700 sm:col-span-2">{saved}</p>}
      <button type="submit" disabled={saving} className="rounded-md bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 sm:col-span-2">
        {saving ? 'Kaydediliyor…' : submitLabel}
      </button>
    </form>
  )
}

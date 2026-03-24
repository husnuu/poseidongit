'use client'

import { useState, useCallback } from 'react'
import Script from 'next/script'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Turnstile } from '@marsidev/react-turnstile'
import FloatingInput from '@/components/ui/FloatingInput'
import FloatingTextarea from '@/components/ui/FloatingTextarea'
import PhoneField from '@/components/ui/PhoneField'
import { CalendarDays, Check, MapPin, Sailboat, Users } from 'lucide-react'
import { DEFAULT_YACHT_INQUIRY_CTA } from '@/lib/yachtConversionCopy'

const DEFAULT_SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

const schema = z.object({
  firstName: z.string().min(1, 'Ad gerekli'),
  lastName: z.string().min(1, 'Soyad gerekli'),
  email: z.string().email('Geçerli e-posta girin'),
  phone: z.string().min(7, 'Telefon gerekli'),
  message: z.string().min(5, 'Mesaj en az 5 karakter olsun'),
})

export type YachtInquiryFormValues = z.infer<typeof schema>

interface YachtInquiryFormProps {
  yachtSlug: string
  yachtName: string
  locationLabel?: string | null
  priceFrom?: number
  currency?: string
  selectedDate: string | null
  guestCount: number
  onSubmitted?: () => void
  submitLabel?: string
}

function formatDateTr(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function YachtInquiryForm({
  yachtSlug,
  yachtName,
  locationLabel,
  priceFrom,
  currency,
  selectedDate,
  guestCount,
  onSubmitted,
  submitLabel = DEFAULT_YACHT_INQUIRY_CTA,
}: YachtInquiryFormProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<YachtInquiryFormValues>({
    resolver: zodResolver(schema) as Resolver<YachtInquiryFormValues>,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
    },
  })

  const phone = watch('phone')

  const onSuccessTurnstile = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const onSubmit = async (data: YachtInquiryFormValues) => {
    if (siteKey && !turnstileToken) {
      setSubmitError('Lütfen doğrulama kutusunu işaretleyin.')
      return
    }
    if (!selectedDate) {
      setSubmitError('Lütfen takvimden bir tarih seçin.')
      return
    }
    setStatus('sending')
    setSubmitError(null)
    try {
      const res = await fetch('/api/yacht-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yachtSlug,
          yachtName,
          location: locationLabel ?? undefined,
          date: selectedDate,
          guestCount,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          message: data.message.trim(),
          priceFrom: priceFrom ?? undefined,
          currency: currency ?? undefined,
          turnstileToken: turnstileToken ?? undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setSubmitError(json.error ?? 'Gönderim başarısız.')
        return
      }
      setStatus('success')
      onSubmitted?.()
    } catch {
      setStatus('error')
      setSubmitError('Bağlantı hatası.')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center"
        style={{ fontFamily: 'var(--font-family)' }}
      >
        <div className="flex justify-center mb-3">
          <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
            <Check className="w-8 h-8" strokeWidth={2.5} aria-hidden />
          </span>
        </div>
        <p className="text-lg font-bold text-emerald-900 m-0">
          Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.
        </p>
      </div>
    )
  }

  return (
    <>
      <Script id={DEFAULT_SCRIPT_ID} src={SCRIPT_URL} strategy="afterInteractive" />
      <div
        className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
        style={{ fontFamily: 'var(--font-family)' }}
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-4 py-3.5">
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1e3a5f]">
            Talep özeti
          </p>
        </div>
        <ul className="m-0 list-none space-y-0 divide-y divide-slate-100 p-0">
          <li className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f]/[0.07] text-[#1e3a5f]">
              <Sailboat className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">Yat</p>
              <p className="m-0 mt-0.5 text-[15px] font-bold leading-snug text-slate-900">{yachtName}</p>
            </div>
          </li>
          {locationLabel ? (
            <li className="flex items-start gap-3 px-4 py-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <MapPin className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">Konum</p>
                <p className="m-0 mt-0.5 text-sm font-semibold leading-snug text-slate-800">
                  {locationLabel}
                </p>
              </div>
            </li>
          ) : null}
          <li className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <CalendarDays className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">Tarih</p>
              <p className="m-0 mt-0.5 text-sm font-semibold leading-snug text-slate-800">
                {formatDateTr(selectedDate)}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Users className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Misafir sayısı
              </p>
              <p className="m-0 mt-0.5 text-sm font-semibold leading-snug text-slate-800">
                {guestCount} kişi
              </p>
            </div>
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingInput
            label="Ad *"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <FloatingInput
            label="Soyad *"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <FloatingInput
          label="E-posta *"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PhoneField
          label="Telefon *"
          name="phone"
          value={phone ?? ''}
          onChange={(v) => setValue('phone', v ?? '', { shouldValidate: true })}
          onBlur={() => {}}
          error={errors.phone?.message}
          defaultCountry="TR"
        />
        <FloatingTextarea
          label="Mesaj / özel talep *"
          rows={4}
          error={errors.message?.message}
          {...register('message')}
        />

        {siteKey && (
          <div className="flex justify-start">
            <Turnstile
              siteKey={siteKey}
              onSuccess={onSuccessTurnstile}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
              options={{ theme: 'light', size: 'normal' }}
              injectScript={false}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'sending' || (!!siteKey && !turnstileToken)}
          className="w-full rounded-xl font-bold uppercase text-white text-base transition disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95"
          style={{
            height: 56,
            backgroundColor: '#2168b8',
            fontFamily: 'var(--font-family)',
          }}
        >
          {status === 'sending' ? 'Gönderiliyor...' : submitLabel}
        </button>

        {submitError && (
          <p className="text-sm text-red-600 m-0" role="alert">
            {submitError}
          </p>
        )}
      </form>
    </>
  )
}

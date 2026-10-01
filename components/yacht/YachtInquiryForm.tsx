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
import bookingStyles from '@/components/booking/booking.module.css'
import { CalendarDays, Check, Clock, MapPin, Moon, Sailboat, Users } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import {
  formatDateTrShort,
  formatOvernightSummaryTr,
  type YachtRentalMode,
} from '@/lib/yachtRentalModes'

const DEFAULT_SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

export type YachtInquiryFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
}

interface YachtInquiryFormProps {
  yachtSlug: string
  yachtName: string
  locationLabel?: string | null
  rentalMode: YachtRentalMode
  priceFrom?: number
  currency?: string
  selectedDate: string | null
  overnightCheckIn: string | null
  overnightCheckOut: string | null
  overnightNights: number | null
  guestCount: number
  onSubmitted?: () => void
  submitLabel?: string
  locale?: SiteLocale
}

export default function YachtInquiryForm({
  yachtSlug,
  yachtName,
  locationLabel,
  rentalMode,
  priceFrom,
  currency,
  selectedDate,
  overnightCheckIn,
  overnightCheckOut,
  overnightNights,
  guestCount,
  onSubmitted,
  submitLabel,
  locale = 'tr',
}: YachtInquiryFormProps) {
  const ui = getYachtUi(locale)
  const resolvedSubmitLabel = submitLabel ?? ui.defaultInquiryCta
  const schema = z.object({
    firstName: z.string().min(1, ui.validationFirstNameRequired),
    lastName: z.string().min(1, ui.validationLastNameRequired),
    email: z.string().email(ui.validationEmailInvalid),
    phone: z.string().min(7, ui.validationPhoneRequired),
    message: z.string().min(5, ui.validationMessageMin),
  })
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
      setSubmitError(ui.turnstileRequired)
      return
    }
    if (rentalMode === 'daily') {
      if (!selectedDate) {
        setSubmitError(ui.selectDateRequired)
        return
      }
    } else {
      if (!overnightCheckIn || !overnightCheckOut || overnightNights == null || overnightNights < 1) {
        setSubmitError(ui.selectRangeRequired)
        return
      }
    }
    setStatus('sending')
    setSubmitError(null)
    try {
      const primaryDate =
        rentalMode === 'daily' ? selectedDate! : overnightCheckIn!
      const res = await fetch('/api/yacht-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yachtSlug,
          yachtName,
          location: locationLabel ?? undefined,
          rentalType: rentalMode,
          date: primaryDate,
          checkIn: rentalMode === 'overnight' ? overnightCheckIn : undefined,
          checkOut: rentalMode === 'overnight' ? overnightCheckOut : undefined,
          nights: rentalMode === 'overnight' ? overnightNights : undefined,
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
        setSubmitError(json.error ?? ui.submitFailed)
        return
      }
      setStatus('success')
      onSubmitted?.()
    } catch {
      setStatus('error')
      setSubmitError(ui.connectionError)
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
          {ui.submitSuccess}
        </p>
      </div>
    )
  }

  const priceLabel =
    priceFrom != null
      ? `${priceFrom.toLocaleString(ui.numberLocale)} ${(currency ?? 'TRY').toUpperCase()}`
      : '—'

  const rentalTypeLabel = rentalMode === 'daily' ? ui.rentalTypeDailyLabel : ui.rentalTypeOvernightLabel

  return (
    <>
      <Script id={DEFAULT_SCRIPT_ID} src={SCRIPT_URL} strategy="afterInteractive" />
      <div
        className="mb-6 overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)]"
        style={{ fontFamily: 'var(--font-family)' }}
      >
        <div className="border-b border-[#f1f5f9] px-4 py-3.5">
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#2168b8]">
            {ui.summaryTitle}
          </p>
        </div>
        <ul className="m-0 list-none space-y-0 divide-y divide-[#f1f5f9] p-0">
          <li className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2168b8]/[0.08] text-[#2168b8]">
              <Sailboat className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">{ui.summaryYacht}</p>
              <p className="m-0 mt-0.5 text-[15px] font-bold leading-snug text-[#131719]">{yachtName}</p>
            </div>
          </li>
          {locationLabel ? (
            <li className="flex items-start gap-3 px-4 py-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                <MapPin className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-[color:var(--muted,#81848b)]">{ui.summaryLocation}</p>
                <p className="m-0 mt-0.5 text-sm font-semibold leading-snug text-[#131719]">
                  {locationLabel}
                </p>
              </div>
            </li>
          ) : null}
          <li className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              {rentalMode === 'daily' ? (
                <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-[color:var(--muted,#81848b)]">
                {ui.summaryRentalType}
              </p>
              <p className="m-0 mt-0.5 text-sm font-semibold leading-snug text-[#131719]">
                {rentalTypeLabel}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <CalendarDays className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-[color:var(--muted,#81848b)]">{ui.summaryDate}</p>
              <p className="m-0 mt-0.5 text-sm font-semibold leading-snug text-[#131719]">
                {rentalMode === 'daily'
                  ? selectedDate
                    ? formatDateTrShort(selectedDate, locale)
                    : '—'
                  : overnightCheckIn && overnightCheckOut && overnightNights != null
                    ? formatOvernightSummaryTr(
                        {
                          checkIn: overnightCheckIn,
                          checkOut: overnightCheckOut,
                        },
                        locale
                      )
                    : '—'}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-[color:var(--muted,#81848b)]">{ui.summaryDuration}</p>
              <p className="m-0 mt-0.5 text-sm font-semibold leading-snug text-[#131719]">
                {rentalMode === 'daily'
                  ? ui.summaryDurationHours
                  : overnightNights != null
                    ? ui.summaryNights(overnightNights)
                    : '—'}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <Users className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-[color:var(--muted,#81848b)]">
                {ui.summaryGuestCount}
              </p>
              <p className="m-0 mt-0.5 text-sm font-semibold leading-snug text-[#131719]">
                {guestCount} {ui.personSuffix}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <span className="text-xs font-black text-zinc-500">₺</span>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-[color:var(--muted,#81848b)]">
                {rentalMode === 'daily' ? ui.summaryDailyPrice : ui.summaryTotalPrice}
              </p>
              <p className="m-0 mt-0.5 text-sm font-semibold leading-snug text-[#131719]">
                {priceLabel}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingInput
            label={ui.labelFirstName}
            autoComplete="given-name"
            error={errors.firstName?.message}
            compact
            variant="outlined"
            {...register('firstName')}
          />
          <FloatingInput
            label={ui.labelLastName}
            autoComplete="family-name"
            error={errors.lastName?.message}
            compact
            variant="outlined"
            {...register('lastName')}
          />
        </div>
        <FloatingInput
          label={ui.labelEmail}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          compact
          variant="outlined"
          {...register('email')}
        />
        <PhoneField
          label={ui.labelPhone}
          name="phone"
          value={phone ?? ''}
          onChange={(v) => setValue('phone', v ?? '', { shouldValidate: true })}
          onBlur={() => {}}
          error={errors.phone?.message}
          defaultCountry="TR"
          compact
          variant="outlined"
        />
        <FloatingTextarea
          label={ui.labelMessage}
          rows={4}
          error={errors.message?.message}
          variant="outlined"
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
          className={`${bookingStyles.stepBtnPrimary} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {status === 'sending' ? ui.sending : resolvedSubmitLabel}
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

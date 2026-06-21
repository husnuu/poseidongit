'use client'

import { useCallback, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Turnstile } from '@marsidev/react-turnstile'
import FloatingInput from '@/components/ui/FloatingInput'
import FloatingTextarea from '@/components/ui/FloatingTextarea'
import PhoneField from '@/components/ui/PhoneField'
import YachtCalendar from '@/components/yacht/YachtCalendar'
import PaymentLoadingOverlay from '@/components/booking/PaymentLoadingOverlay'
import { submitNestpayForm } from '@/lib/nestpay/submitPaymentForm'
import { withLocalePath } from '@/lib/i18n/paths'
import type { YachtDepositPageUi } from '@/lib/i18n/strings/yachtDepositPage'
import type { SiteLocale } from '@/lib/i18n/config'
import type { YachtDepositCharterConfig } from '@/lib/yachtDepositCharter'
import YachtDepositCharterSummary from '@/components/yacht/YachtDepositCharterSummary'
import styles from '@/components/StickyBookingCard.module.css'
import bookingStyles from '@/components/booking/booking.module.css'

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

type FormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  yachtName: string
  message: string
  termsAccepted: boolean
}

interface YachtDepositCheckoutFormProps {
  depositAmount: number
  currency?: string
  locale: SiteLocale
  ui: YachtDepositPageUi
  charterConfig?: YachtDepositCharterConfig | null
}

export default function YachtDepositCheckoutForm({
  depositAmount,
  currency = 'TRY',
  locale,
  ui,
  charterConfig = null,
}: YachtDepositCheckoutFormProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [charterDate, setCharterDate] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)

  const termsHref = withLocalePath(locale, '/yasal/mesafeli-satis-sozlesmesi')

  const schema = z.object({
    firstName: z.string().min(1, ui.valFirstName),
    lastName: z.string().min(1, ui.valLastName),
    email: z.string().email(ui.valEmail),
    phone: z.string().min(7, ui.valPhone),
    yachtName: z.string().optional(),
    message: z.string().optional(),
    termsAccepted: z.boolean().refine((v) => v, { message: ui.valTerms }),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      yachtName: '',
      message: '',
      termsAccepted: false,
    },
  })

  const phone = watch('phone')
  const termsAccepted = watch('termsAccepted')
  const amountLabel =
    currency === 'TRY' || currency === 'TRL'
      ? `${depositAmount.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR')} ₺`
      : `${depositAmount.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR')} ${currency}`

  const onSuccessTurnstile = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const onSubmit = async (data: FormValues) => {
    const effectiveCharterDate = charterConfig?.charterDateStart ?? charterDate
    if (!effectiveCharterDate) {
      setDateError(ui.valCharterDate)
      return
    }
    setDateError(null)

    if (siteKey && !turnstileToken) {
      setError(ui.turnstileError)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/yacht-deposit/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          charterDate: effectiveCharterDate,
          charterDateEnd: charterConfig?.charterDateEnd ?? undefined,
          yachtId: charterConfig?.yachtId,
          yachtSlug: charterConfig?.yachtSlug ?? undefined,
          yachtName: (charterConfig?.yachtName ?? data.yachtName?.trim()) || undefined,
          message: data.message?.trim() || undefined,
          termsAccepted: true,
          locale,
          turnstileToken: turnstileToken ?? undefined,
        }),
      })
      const json = (await res.json()) as {
        action?: string
        fields?: Record<string, string>
        error?: string
      }
      if (!res.ok || !json.action || !json.fields) {
        setError(json.error ?? ui.payError)
        setSubmitting(false)
        return
      }
      // Overlay'in bir kare boyunca görünmesi için; tur rezervasyonu ile aynı akış
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          submitNestpayForm(json.action!, json.fields!)
        })
      })
      return
    } catch {
      setError(ui.networkError)
      setSubmitting(false)
    }
  }

  if (submitting) {
    return <PaymentLoadingOverlay locale={locale} />
  }

  return (
    <div className={styles.depositPanel}>
      <div className={styles.content}>
        <h2 className={styles.title}>{ui.formSectionTitle}</h2>

        <div className={styles.priceBlock}>
          <span className={styles.priceFrom}>{ui.depositLabel}</span>
          <span className={styles.priceValue}>{amountLabel}</span>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {charterConfig ? (
            <YachtDepositCharterSummary config={charterConfig} locale={locale} compact />
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <YachtCalendar
                locale={locale}
                title={ui.calendarTitle}
                compactTitle
                selectionMode="single"
                selectedDate={charterDate}
                onSelectDate={(d) => {
                  setCharterDate(d)
                  setDateError(null)
                }}
              />
              {dateError ? (
                <p className="m-0 mt-2 text-sm font-semibold text-red-600" role="alert">
                  {dateError}
                </p>
              ) : null}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingInput
              id="yd-first"
              label={ui.labelFirstName}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <FloatingInput
              id="yd-last"
              label={ui.labelLastName}
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
          <FloatingInput
            id="yd-email"
            type="email"
            label={ui.labelEmail}
            error={errors.email?.message}
            {...register('email')}
          />
          <PhoneField
            id="yd-phone"
            label={ui.labelPhone}
            value={phone}
            onChange={(v) => setValue('phone', v ?? '', { shouldValidate: true })}
            error={errors.phone?.message}
          />
          {!charterConfig ? (
            <FloatingInput id="yd-yacht" label={ui.yachtNameLabel} {...register('yachtName')} />
          ) : null}
          <FloatingTextarea id="yd-msg" label={ui.messageLabel} rows={3} {...register('message')} />

          <div className={bookingStyles.termsCard}>
            <label className={bookingStyles.termsRow}>
              <input
                type="checkbox"
                className={bookingStyles.termsCheckbox}
                {...register('termsAccepted')}
                aria-describedby="yacht-deposit-terms"
              />
              <span id="yacht-deposit-terms" className={bookingStyles.termsText}>
                {ui.termsCheckboxLead}
                <Link
                  href={termsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={bookingStyles.termsLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  {ui.termsLinkText}
                </Link>
                {ui.termsCheckboxTrail}
              </span>
            </label>
            {errors.termsAccepted?.message ? (
              <p className="m-0 mt-2 text-sm font-semibold text-red-600" role="alert">
                {errors.termsAccepted.message}
              </p>
            ) : null}
          </div>

          {siteKey ? (
            <>
              <Script src={SCRIPT_URL} strategy="lazyOnload" />
              <Turnstile siteKey={siteKey} onSuccess={onSuccessTurnstile} />
            </>
          ) : null}

          {error ? (
            <p className="m-0 text-sm font-semibold text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <p className="m-0 text-xs text-zinc-500 leading-snug">{ui.redirectNote}</p>

          <button
            type="submit"
            className={styles.ctaButton}
            disabled={submitting || !termsAccepted}
          >
            {submitting ? ui.processingLabel : ui.submitLabel}
          </button>

          <p className="m-0 text-xs text-zinc-500 leading-snug">{ui.secureNote}</p>
        </form>
      </div>
    </div>
  )
}

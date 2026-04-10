'use client'

import { useState, useCallback, useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Script from 'next/script'
import { Turnstile } from '@marsidev/react-turnstile'
import { Check } from 'lucide-react'
import FloatingInput from '@/components/ui/FloatingInput'
import FloatingTextarea from '@/components/ui/FloatingTextarea'
import PhoneField from '@/components/ui/PhoneField'
import type { ContactPageUiStrings } from '@/lib/i18n/strings/contactPage'

const DEFAULT_SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

function buildContactSchema(s: Pick<
  ContactPageUiStrings,
  'valNameMin' | 'valGroupMin' | 'valEmail' | 'valMessageMin'
>) {
  return z.object({
    name: z.string().min(2, s.valNameMin),
    groupSize: z.coerce.number().min(1, s.valGroupMin),
    email: z.string().email(s.valEmail),
    phone: z.string().optional(),
    message: z.string().min(10, s.valMessageMin),
  })
}

type ContactFormValues = z.infer<ReturnType<typeof buildContactSchema>>

export type ContactFormProps = ContactPageUiStrings & {
  submitLabel: string
  successMessage: string
}

export default function ContactForm(props: ContactFormProps) {
  const {
    submitLabel,
    successMessage,
    labelFullName,
    labelGroupSize,
    labelEmail,
    labelPhone,
    labelMessage,
    sending,
    turnstileError,
    submitErrorGeneric,
    submitErrorNetwork,
    valNameMin,
    valGroupMin,
    valEmail,
    valMessageMin,
  } = props
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      buildContactSchema({
        valNameMin,
        valGroupMin,
        valEmail,
        valMessageMin,
      }),
    [valNameMin, valGroupMin, valEmail, valMessageMin],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema) as Resolver<ContactFormValues>,
    defaultValues: {
      name: '',
      groupSize: 1,
      email: '',
      phone: '',
      message: '',
    },
  })

  const nameValue = watch('name')
  const groupSizeValue = watch('groupSize')
  const emailValue = watch('email')
  const phoneValue = watch('phone')
  const messageValue = watch('message')

  const onSuccessTurnstile = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const onSubmit = async (data: ContactFormValues) => {
    if (!turnstileToken) {
      setSubmitError(turnstileError)
      return
    }
    setStatus('sending')
    setSubmitError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          groupSize: Number(data.groupSize),
          email: data.email,
          phone: data.phone?.trim() || undefined,
          message: data.message,
          turnstileToken,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setSubmitError(json.error ?? submitErrorGeneric)
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setSubmitError(submitErrorNetwork)
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 flex items-center gap-3 text-emerald-800"
        style={{ fontFamily: 'var(--font-family)' }}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-200">
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <p className="font-medium">{successMessage}</p>
      </div>
    )
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

  return (
    <>
      <Script
        id={DEFAULT_SCRIPT_ID}
        src={SCRIPT_URL}
        strategy="afterInteractive"
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        style={{ fontFamily: 'var(--font-family)' }}
        noValidate
      >
        {/* Row1: Full Name | Group Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FloatingInput
            label={labelFullName}
            error={errors.name?.message}
            {...register('name')}
          />
          <FloatingInput
            label={labelGroupSize}
            type="number"
            min={1}
            value={groupSizeValue ?? ''}
            error={errors.groupSize?.message}
            {...register('groupSize')}
          />
        </div>

        {/* Row2: Email | Phone Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FloatingInput
            label={labelEmail}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <PhoneField
            label={labelPhone}
            name="phone"
            value={phoneValue ?? ''}
            onChange={(v) => setValue('phone', v ?? '', { shouldValidate: true })}
            onBlur={() => {}}
            error={errors.phone?.message}
            defaultCountry="TR"
          />
        </div>

        {/* Row3: Message – full width */}
        <FloatingTextarea
          label={labelMessage}
          rows={5}
          error={errors.message?.message}
          {...register('message')}
        />

        {/* Row4: Turnstile */}
        {/* Turnstile – gönder butonunun hemen üstünde */}
        {siteKey && (
          <div className="flex justify-start mb-4">
            <Turnstile
              siteKey={siteKey}
              onSuccess={onSuccessTurnstile}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
              options={{
                theme: 'light',
                size: 'normal',
              }}
              injectScript={false}
            />
          </div>
        )}

        {/* Gönder butonu */}
        <button
          type="submit"
          disabled={status === 'sending' || (!!siteKey && !turnstileToken)}
          className="w-full rounded-xl font-bold uppercase text-white text-base transition disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95"
          style={{
            height: 56,
            backgroundColor: '#2168b8',
          }}
        >
          {status === 'sending' ? sending : submitLabel}
        </button>

        {submitError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}
      </form>
    </>
  )
}

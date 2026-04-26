'use client'

/**
 * /payment/redirect
 *
 * Banka ödeme formunu otomatik olarak submit eden ara sayfa.
 * BookingWizard step-4 tamamlandıktan sonra sessionStorage'a
 * { action, fields } yazılır ve kullanıcı buraya yönlendirilir.
 *
 * Güvenlik: geri tuşuyla aynı xid'le iki kez işlem başlamasını
 * önlemek için form otomatik submit edildikten sonra sessionStorage
 * temizlenir. Sayfa render edilir edilmez form bankaya POST gönderir.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'nestpay_payment_init'

type PaymentInit = {
  action: string
  fields: Record<string, string>
}

export default function PaymentRedirectPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [init, setInit] = useState<PaymentInit | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setError('Ödeme oturumu bulunamadı. Lütfen rezervasyon sayfasına geri dönün.')
      return
    }

    let parsed: PaymentInit
    try {
      parsed = JSON.parse(raw) as PaymentInit
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
      setError('Ödeme verisi bozuk. Lütfen tekrar deneyin.')
      return
    }

    if (!parsed.action || !parsed.fields || typeof parsed.fields !== 'object') {
      sessionStorage.removeItem(STORAGE_KEY)
      setError('Ödeme verisi eksik. Lütfen tekrar deneyin.')
      return
    }

    // sessionStorage'ı hemen temizle — geri tuşu ile xid çakışması önlenir
    sessionStorage.removeItem(STORAGE_KEY)
    setInit(parsed)
  }, [])

  // Form set edilince 1 frame bekleyip submit et
  useEffect(() => {
    if (!init) return
    const frame = requestAnimationFrame(() => {
      formRef.current?.submit()
    })
    return () => cancelAnimationFrame(frame)
  }, [init])

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-zinc-900">Yönlendirme başarısız</h1>
          <p className="mt-2 text-sm text-zinc-600">{error}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1f3c88] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162d66]"
          >
            Geri dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 gap-6">
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <svg
          className="h-10 w-10 animate-spin text-[#1f3c88]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-sm font-medium text-zinc-700">Güvenli ödeme sayfasına yönlendiriliyorsunuz…</p>
        <p className="text-xs text-zinc-400">Lütfen bekleyin, sayfayı kapatmayın.</p>
      </div>

      {/* Gizli otomatik form */}
      {init && (
        <form ref={formRef} action={init.action} method="POST" style={{ display: 'none' }}>
          {Object.entries(init.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      )}
    </div>
  )
}

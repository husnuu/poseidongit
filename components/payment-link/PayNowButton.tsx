'use client'

import { useState } from 'react'
import { submitNestpayForm } from '@/lib/nestpay/submitPaymentForm'

export default function PayNowButton({
  bookingId,
  label,
  processingLabel,
  errorFallback,
}: {
  bookingId: string
  label: string
  processingLabel: string
  errorFallback: string
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/payment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.action || !data.fields) {
        setError(data.error || errorFallback)
        setSubmitting(false)
        return
      }
      submitNestpayForm(data.action, data.fields)
    } catch {
      setError(errorFallback)
      setSubmitting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePay}
        disabled={submitting}
        className="flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-base font-bold text-white disabled:opacity-60"
        style={{ background: 'var(--primary, #2168b8)' }}
      >
        {submitting ? processingLabel : label}
      </button>
      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import type { PartnerBookingView, PartnerSummary } from '@/lib/partner/commission'

export type PartnerPanelData = {
  partner: { slug: string; name: string; email: string; commissionRate: number; logoData: string | null }
  baseUrl: string
  summary: PartnerSummary
  bookings: PartnerBookingView[]
}

export function usePartnerData() {
  const [data, setData] = useState<PartnerPanelData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/partner/me')
        if (res.status === 401) {
          window.location.replace('/partner/giris')
          return
        }
        const json = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) setError(json.error ?? 'Veriler yüklenemedi.')
        else setData(json as PartnerPanelData)
      } catch {
        if (!cancelled) setError('Bağlantı hatası.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { data, error }
}

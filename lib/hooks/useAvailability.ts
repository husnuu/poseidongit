'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import type { Availability } from '@/types/availability'

export type UsedByDateAndClass = Record<string, Record<string, number>>

/** Fetched used + optimistic (yeni yapılan rezervasyon) birleştirir; kalan kontenjan = Sanity kapasitesi - bu değer. */
function mergeUsed(
  fetched: UsedByDateAndClass,
  optimistic?: UsedByDateAndClass | null
): UsedByDateAndClass {
  if (!optimistic || Object.keys(optimistic).length === 0) return fetched
  const out: UsedByDateAndClass = {}
  const allDates = new Set([...Object.keys(fetched), ...Object.keys(optimistic)])
  for (const date of allDates) {
    const byClass: Record<string, number> = {}
    const f = fetched[date] ?? {}
    const o = optimistic[date] ?? {}
    const classes = new Set([...Object.keys(f), ...Object.keys(o)])
    for (const c of classes) {
      byClass[c] = (f[c] ?? 0) + (o[c] ?? 0)
    }
    out[date] = byClass
  }
  return out
}

/** Build used map from single-date Availability response. */
function usedFromAvailability(data: Availability): UsedByDateAndClass {
  const byClass: Record<string, number> = {}
  for (const [classKey, info] of Object.entries(data.classes)) {
    byClass[classKey] = info.booked
  }
  return { [data.date]: byClass }
}

export function useAvailability(
  tourId: string | undefined,
  dates: string[],
  options?: { tourSlug?: string; optimisticUsed?: UsedByDateAndClass | null; invalidateKey?: string }
): {
  usedByDate: UsedByDateAndClass
  availability: Availability | null
  loading: boolean
  error: string | null
} {
  const [fetchedUsed, setFetchedUsed] = useState<UsedByDateAndClass>({})
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFetch = useRef<string>('')
  const optimisticUsed = options?.optimisticUsed ?? null

  useEffect(() => {
    if (!tourId) {
      lastFetch.current = ''
      setFetchedUsed({})
      setAvailability(null)
      setLoading(false)
      setError(null)
      return
    }
    const slug = options?.tourSlug?.trim()
    const datesToSend = dates.length > 0 ? dates : [new Date().toISOString().slice(0, 10)]
    const invalidateKey = options?.invalidateKey ?? ''
    const key = `${tourId}:${slug ?? ''}:${[...datesToSend].sort().join(',')}:${invalidateKey}`
    if (lastFetch.current === key) return
    lastFetch.current = key

    let cancelled = false
    setLoading(true)
    setError(null)

    const isSingleDate = datesToSend.length === 1
    const singleDate = isSingleDate ? datesToSend[0] : null

    if (isSingleDate && singleDate) {
      const params = new URLSearchParams({ tourId, date: singleDate })
      if (slug && slug !== tourId) params.set('tourSlug', slug)
      params.set('_t', String(Date.now()))
      fetch(`/api/availability?${params}`, { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error(res.status === 400 ? 'Geçersiz istek' : 'Sunucu hatası')
          return res.json()
        })
        .then((data: Availability) => {
          if (!cancelled) {
            setAvailability(data)
            setFetchedUsed(usedFromAvailability(data))
            setError(null)
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setAvailability(null)
            setFetchedUsed({})
            setError(err instanceof Error ? err.message : 'Yüklenemedi')
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    } else {
      setAvailability(null)
      const params = new URLSearchParams({ tourId, dates: datesToSend.join(',') })
      if (slug && slug !== tourId) params.set('tourSlug', slug)
      params.set('_t', String(Date.now()))
      fetch(`/api/availability?${params}`, { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error(res.status === 400 ? 'Geçersiz istek' : 'Sunucu hatası')
          return res.json()
        })
        .then((data: { used?: UsedByDateAndClass }) => {
          if (!cancelled) {
            setFetchedUsed(data.used ?? {})
            setError(null)
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setFetchedUsed({})
            setError(err instanceof Error ? err.message : 'Yüklenemedi')
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [tourId, options?.tourSlug, options?.invalidateKey, dates.join(',')])

  const usedByDate = useMemo(
    () => mergeUsed(fetchedUsed, optimisticUsed),
    [fetchedUsed, optimisticUsed]
  )

  return { usedByDate, availability, loading, error }
}

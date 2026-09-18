'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Keyboard, CheckCircle2, XCircle } from 'lucide-react'

const SCANNER_ELEMENT_ID = 'crew-qr-scanner'

interface CheckinResult {
  id: string
  reference: string
  passengerName: string
  tourTitle: string
  time: string | null
  guestCount: number
  boarded: boolean
  mealCounts: { label: string; count: number }[]
}

export default function ScanClient() {
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckinResult | null>(null)
  const busyRef = useRef(false)

  const submitCode = useCallback(async (code: string) => {
    if (busyRef.current || !code.trim()) return
    busyRef.current = true
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/crew/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), action: 'board' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Geçersiz kod.')
        setResult(null)
        return
      }
      setResult(data.booking)
      setManualOpen(false)
      setManualCode('')
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
      busyRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return
      const instance = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = instance
      instance
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!busyRef.current) submitCode(decodedText)
          },
          () => {
            // per-frame decode miss — ignore
          }
        )
        .then(() => setScanning(true))
        .catch(() => setCameraError('Kameraya erişilemedi. Kodu manuel girebilirsiniz.'))
    })

    return () => {
      cancelled = true
      const inst = scannerRef.current
      if (inst) {
        inst.stop().catch(() => {}).finally(() => inst.clear())
      }
    }
  }, [submitCode])

  const handleUndo = useCallback(async () => {
    if (!result) return
    setLoading(true)
    try {
      await fetch('/api/crew/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: result.id, action: 'undo' }),
      })
    } finally {
      setLoading(false)
      setResult(null)
    }
  }, [result])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="flex items-center justify-between px-4 pt-4">
        <Link href="/ekip" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h1 className="m-0 text-sm font-bold uppercase tracking-wide text-white">Scan Pass</h1>
        <span className="w-9" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <p className="mb-6 text-center text-sm text-zinc-400">Position the QR code within the frame to scan</p>
        <div
          id={SCANNER_ELEMENT_ID}
          className="aspect-square w-full max-w-xs overflow-hidden rounded-2xl border-2 border-amber-400/80"
        />
        {cameraError && <p className="mt-4 max-w-xs text-center text-sm text-amber-300">{cameraError}</p>}
        {error && <p className="mt-4 text-center text-sm font-semibold text-red-400">{error}</p>}
        {loading && !result && <p className="mt-4 text-sm text-zinc-400">Kontrol ediliyor...</p>}

        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="mt-8 flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white"
        >
          <Keyboard className="h-4 w-4" aria-hidden />
          Enter code manually
        </button>
      </div>

      {manualOpen && (
        <div
          className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 p-4"
          onClick={() => setManualOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="m-0 mb-3 text-sm font-bold text-[#131719]">Rezervasyon kodu</p>
            <input
              type="text"
              autoFocus
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Örn. MLT-15483"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-base uppercase focus:border-[#2168b8] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => submitCode(manualCode)}
              disabled={loading || !manualCode.trim()}
              className="mt-3 w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: 'var(--primary, #2168b8)' }}
            >
              Doğrula
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200" />
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-lg font-black text-[#131719]">Valid Pass</p>
                <p className="m-0 text-sm font-semibold text-emerald-600">Booking confirmed</p>
              </div>
              <span className="shrink-0 font-mono text-sm font-bold text-zinc-400">#{result.reference}</span>
            </div>

            <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Passenger</p>
              <p className="m-0 mt-0.5 text-base font-bold text-[#131719]">{result.passengerName}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3">
                <div>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Tour</p>
                  <p className="m-0 mt-0.5 text-sm font-semibold text-[#131719]">{result.tourTitle}</p>
                </div>
                <div>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Guests</p>
                  <p className="m-0 mt-0.5 text-sm font-semibold text-[#131719]">
                    {result.guestCount} guest{result.guestCount === 1 ? '' : 's'}
                    {result.time ? ` · ${result.time}` : ''}
                  </p>
                </div>
              </div>
              {result.mealCounts.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Meals: {result.mealCounts.map((m) => `${m.label} ×${m.count}`).join(', ')}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleUndo}
                className="text-sm font-semibold text-zinc-500"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="flex-1 rounded-xl py-3.5 text-sm font-bold text-white"
                style={{ background: 'var(--primary, #2168b8)' }}
              >
                Board next
              </button>
            </div>
          </div>
        </div>
      )}

      {!scanning && !cameraError && (
        <p className="pb-6 text-center text-xs text-zinc-500">Kamera başlatılıyor...</p>
      )}
    </div>
  )
}

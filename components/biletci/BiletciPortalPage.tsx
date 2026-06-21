'use client'

import { useState, useEffect, useCallback } from 'react'
import ManualBookingDrawer from '@/components/admin/bookings/ManualBookingDrawer'
import type { TourOption } from '@/types/adminBookings'
import { adminFetchInit } from '@/lib/adminRequestInit'

const AGENT_TOKEN_STORAGE_KEY = 'poseidon_agent_token'
const AGENT_EMAIL_STORAGE_KEY = 'poseidon_agent_email'

/**
 * Biletçi manuel rezervasyon portalı (yalnızca AGENT_LOGIN_EMAIL + şifre / JWT).
 * `/biletci` rotasında kullanılır; admin oturumu gerekmez.
 */
export default function BiletciPortalPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [submittedToken, setSubmittedToken] = useState('')
  const [tours, setTours] = useState<TourOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginChecking, setLoginChecking] = useState(false)

  useEffect(() => {
    if (submittedToken) return
    if (typeof window === 'undefined') return
    const t = window.sessionStorage.getItem(AGENT_TOKEN_STORAGE_KEY)?.trim()
    const em = window.sessionStorage.getItem(AGENT_EMAIL_STORAGE_KEY)?.trim().toLowerCase() ?? ''
    if (t) {
      setSubmittedToken(t)
      if (em) setSubmittedEmail(em)
    }
  }, [submittedToken])

  const fetchTours = useCallback(async () => {
    if (!submittedToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        '/api/admin/tours',
        adminFetchInit({}, { bearerToken: submittedToken, adminEmail: submittedEmail || null })
      )
      if (res.status === 401) {
        setError('Oturum süresi doldu veya giriş geçersiz.')
        setSubmittedToken('')
        setSubmittedEmail('')
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(AGENT_TOKEN_STORAGE_KEY)
          window.sessionStorage.removeItem(AGENT_EMAIL_STORAGE_KEY)
        }
        return
      }
      if (!res.ok) {
        setError('Turlar yüklenemedi.')
        return
      }
      const data = await res.json()
      setTours(data.tours ?? [])
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }, [submittedToken, submittedEmail])

  useEffect(() => {
    if (submittedToken) void fetchTours()
  }, [submittedToken, fetchTours])

  const handleAgentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const eMail = email.trim().toLowerCase()
    const pw = password
    if (!eMail || !pw) return
    setError(null)
    setLoginChecking(true)
    try {
      const res = await fetch('/api/admin/agent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: eMail, password: pw }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; token?: string; email?: string }
      if (!res.ok) {
        setError(data.error || (res.status === 503 ? 'Sunucu yapılandırması eksik.' : 'Giriş yapılamadı.'))
        setLoginChecking(false)
        return
      }
      const t = typeof data.token === 'string' ? data.token.trim() : ''
      const em = typeof data.email === 'string' ? data.email.trim().toLowerCase() : eMail
      if (!t) {
        setError('Sunucu yanıtı geçersiz.')
        setLoginChecking(false)
        return
      }
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(AGENT_TOKEN_STORAGE_KEY, t)
        window.sessionStorage.setItem(AGENT_EMAIL_STORAGE_KEY, em)
      }
      setSubmittedToken(t)
      setSubmittedEmail(em)
      setPassword('')
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoginChecking(false)
    }
  }

  const handleLogout = () => {
    setSubmittedToken('')
    setSubmittedEmail('')
    setPassword('')
    setEmail('')
    setError(null)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AGENT_TOKEN_STORAGE_KEY)
      window.sessionStorage.removeItem(AGENT_EMAIL_STORAGE_KEY)
    }
  }

  if (!submittedToken) {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-50 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]"
        style={{ fontFamily: 'var(--font-family)' }}
      >
        <div className="w-full max-w-[min(100%,400px)]">
          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.12)]">
            <div className="bg-[#1e3a5f] px-6 py-6 text-white">
              <h1 className="text-xl font-black uppercase tracking-wide sm:text-2xl">Biletçi</h1>
              <p className="mt-1.5 text-sm text-white/75">Manuel rezervasyon girişi</p>
            </div>
            <div className="p-6 sm:p-7">
              {error ? (
                <div
                  className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}
              <form onSubmit={handleAgentLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@firma.com"
                    className="mt-2 min-h-[48px] w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-[#fc6c4f] focus:outline-none focus:ring-4 focus:ring-[#fc6c4f]/15"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">
                    Şifre
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-2 min-h-[48px] w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-[#fc6c4f] focus:outline-none focus:ring-4 focus:ring-[#fc6c4f]/15"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email.trim() || !password || loginChecking}
                  className="min-h-[50px] w-full rounded-xl bg-[#1e3a8a] py-3.5 text-base font-black uppercase tracking-wide text-white shadow-md transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
                >
                  {loginChecking ? 'Kontrol ediliyor…' : 'Giriş yap'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-[100dvh] bg-zinc-50 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-6 sm:pt-5"
      style={{ fontFamily: 'var(--font-family)' }}
    >
      <div className="mx-auto w-full max-w-lg sm:max-w-xl">
        {loading ? (
          <div className="flex min-h-[60dvh] flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white p-12 shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1e3a8a] border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-zinc-600">Turlar yükleniyor…</p>
          </div>
        ) : (
          <ManualBookingDrawer
            open
            onClose={() => {}}
            onSuccess={() => {}}
            tours={tours}
            authToken={submittedToken}
            adminEmail={submittedEmail || undefined}
            standalone
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  )
}

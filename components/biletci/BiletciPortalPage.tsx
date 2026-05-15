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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-teal-50/30 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[min(100%,420px)]">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-5 py-5 text-white sm:px-6 sm:py-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <div className="min-w-0 pt-0.5">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Biletçi</h1>
                  <p className="mt-1 text-sm text-white/75">Manuel rezervasyon girişi</p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {error && (
                <div
                  className="mb-5 rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                  role="alert"
                >
                  {error}
                </div>
              )}
              <form onSubmit={handleAgentLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">E-posta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@firma.com"
                    className="mt-2 min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Şifre</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-2 min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email.trim() || !password || loginChecking}
                  className="min-h-[48px] w-full rounded-2xl bg-teal-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:pointer-events-none disabled:opacity-50"
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
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-slate-100/80 to-slate-50 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-6 sm:pt-4">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col sm:max-w-3xl">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white/90 p-12 shadow-lg shadow-slate-900/5 backdrop-blur-sm sm:p-16">
            <div className="h-11 w-11 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-slate-600">Turlar yükleniyor…</p>
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

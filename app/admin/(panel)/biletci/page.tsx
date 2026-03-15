'use client'

import { useState, useEffect, useCallback } from 'react'
import ManualBookingDrawer from '@/components/admin/bookings/ManualBookingDrawer'
import type { TourOption } from '@/types/adminBookings'

const AGENT_TOKEN_STORAGE_KEY = 'poseidon_agent_token'
const AGENT_EMAIL_STORAGE_KEY = 'poseidon_agent_email'
const ADMIN_EMAIL_HEADER = 'X-Admin-Email'

export default function AdminBiletciPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [submittedToken, setSubmittedToken] = useState('')
  const [tours, setTours] = useState<TourOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [loginChecking, setLoginChecking] = useState(false)

  const fetchTours = useCallback(async () => {
    if (!submittedToken) return
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${submittedToken}` }
      if (submittedEmail) headers[ADMIN_EMAIL_HEADER] = submittedEmail
      const res = await fetch('/api/admin/tours', { headers })
      if (res.status === 401) {
        setError('E-posta veya şifre hatalı.')
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
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (submittedToken) fetchTours()
  }, [submittedToken, fetchTours])

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = token.trim()
    const eMail = email.trim().toLowerCase()
    if (!t) return
    setError(null)
    setLoginChecking(true)
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${t}` }
      if (eMail) headers[ADMIN_EMAIL_HEADER] = eMail
      const res = await fetch('/api/admin/tours', { headers })
      if (res.status === 401) {
        setError('E-posta veya şifre hatalı.')
        setLoginChecking(false)
        return
      }
      if (!res.ok) {
        setError('Giriş yapılamadı.')
        setLoginChecking(false)
        return
      }
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(AGENT_TOKEN_STORAGE_KEY, t)
        if (eMail) window.sessionStorage.setItem(AGENT_EMAIL_STORAGE_KEY, eMail)
      }
      setSubmittedToken(t)
      setSubmittedEmail(eMail)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoginChecking(false)
    }
  }

  const handleLogout = () => {
    setSubmittedToken('')
    setSubmittedEmail('')
    setToken('')
    setEmail('')
    setError(null)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AGENT_TOKEN_STORAGE_KEY)
      window.sessionStorage.removeItem(AGENT_EMAIL_STORAGE_KEY)
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  if (!submittedToken) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 p-6">
        <div className="w-full max-w-[420px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/50">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">Biletçi / Acente</h1>
                  <p className="mt-0.5 text-xs text-slate-200">Manuel rezervasyon</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {error && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {error}
                </div>
              )}
              <form onSubmit={handleTokenSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">E-posta adresiniz</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-posta adresinizi girin"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Şifreniz</label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Şifrenizi girin"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!token.trim() || loginChecking}
                  className="w-full rounded-xl bg-slate-700 py-3.5 font-semibold text-white shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-slate-700"
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
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Yükleniyor…</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/30">
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
          </div>
        )}
      </div>
    </div>
  )
}

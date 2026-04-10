'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [panelToken, setPanelToken] = useState('')
  const [requiresPanelToken, setRequiresPanelToken] = useState(false)
  const [loginConfigLoaded, setLoginConfigLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/admin/session/login-config', { method: 'GET' })
        const data = (await res.json().catch(() => ({}))) as { requiresPanelToken?: boolean }
        if (!cancelled) {
          setRequiresPanelToken(!!data.requiresPanelToken)
          setLoginConfigLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setRequiresPanelToken(true)
          setLoginConfigLoaded(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const redirectTo = useMemo(() => {
    const from = searchParams.get('from')?.trim()
    if (!from || !from.startsWith('/')) return '/admin/bookings'
    return from
  }, [searchParams])

  const queryError = searchParams.get('error')

  const queryErrorMessage = useMemo(() => {
    if (queryError === 'forbidden') return 'Bu hesap admin paneline erişemiyor.'
    if (queryError === 'session') return 'Oturum süresi doldu (1 saat). Lütfen tekrar giriş yapın.'
    if (queryError === 'config')
      return 'Sunucu yapılandırması eksik (.env içinde ADMIN_JWT_SECRET, en az 24 karakter).'
    return null
  }, [queryError])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (requiresPanelToken && !panelToken.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/session/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(panelToken.trim() ? { panelToken: panelToken.trim() } : {}),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Giriş başarısız.')
        setSubmitting(false)
        return
      }
      router.replace(redirectTo)
    } catch {
      setError('Bağlantı hatası.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 text-white">
          <h1 className="text-lg font-bold">Admin girişi</h1>
          <p className="text-xs text-teal-100">E-posta ve şifre (admin_users)</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-6">
          {(queryErrorMessage || error) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error ?? queryErrorMessage}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              autoComplete="current-password"
              required
            />
          </div>
          {loginConfigLoaded && requiresPanelToken && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Panel güvenlik anahtarı
              </label>
              <input
                type="password"
                value={panelToken}
                onChange={(e) => setPanelToken(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                autoComplete="off"
                required
                placeholder="Sunucuda tanımlı ADMIN_LOGIN_TOKEN"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !loginConfigLoaded}
            className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? 'Giriş yapılıyor…' : !loginConfigLoaded ? 'Yükleniyor…' : 'Giriş yap'}
          </button>
          <p className="text-center text-sm text-slate-500">
            <Link href="/" className="text-teal-700 hover:underline">
              Siteye dön
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

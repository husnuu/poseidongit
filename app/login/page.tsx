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
    if (queryError === 'idle')
      return '10 dakika boyunca işlem yapılmadığı için oturum güvenlik nedeniyle kapatıldı. Tekrar giriş yapın.'
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white shadow-[0_4px_20px_rgba(19,23,25,0.08)]">
        <div className="px-6 py-5" style={{ background: '#2168b8' }}>
          <h1 className="text-lg font-black text-white">Admin girişi</h1>
          <p className="text-xs text-white/80">E-posta ve şifre (admin_users)</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-6">
          {(queryErrorMessage || error) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800">
              {error ?? queryErrorMessage}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-zinc-500">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[#131719] focus:border-[#2168b8] focus:outline-none"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-zinc-500">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[#131719] focus:border-[#2168b8] focus:outline-none"
              autoComplete="current-password"
              required
            />
          </div>
          {loginConfigLoaded && requiresPanelToken && (
            <div>
              <label className="mb-1.5 block text-sm font-bold text-zinc-500">
                Panel güvenlik anahtarı
              </label>
              <input
                type="password"
                value={panelToken}
                onChange={(e) => setPanelToken(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 font-mono text-sm text-[#131719] focus:border-[#2168b8] focus:outline-none"
                autoComplete="off"
                required
                placeholder="Sunucuda tanımlı ADMIN_LOGIN_TOKEN"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !loginConfigLoaded}
            className="w-full rounded-xl bg-[#2168b8] py-2.5 font-bold text-white hover:bg-[#1b5697] disabled:opacity-60"
          >
            {submitting ? 'Giriş yapılıyor…' : !loginConfigLoaded ? 'Yükleniyor…' : 'Giriş yap'}
          </button>
          <p className="text-center text-sm text-zinc-400">
            <Link href="/" className="font-semibold text-[#2168b8] hover:underline">
              Siteye dön
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

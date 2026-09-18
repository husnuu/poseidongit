'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ship, Lock } from 'lucide-react'

export default function CrewLoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/crew/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: code.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Giriş başarısız.')
        return
      }
      router.replace('/ekip')
      router.refresh()
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-50 p-4"
      style={{ fontFamily: 'var(--font-family)' }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#f1f5f9] bg-white p-8 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2168b8]/10 text-[#2168b8]">
          <Ship className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-center text-xl font-black text-[#131719]">Ekip Girişi</h1>
        <p className="mt-1.5 text-center text-sm text-zinc-500">Erişim kodunuzu girin</p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Erişim kodu"
              className="w-full rounded-xl border border-zinc-200 py-3.5 pl-10 pr-3.5 text-base focus:border-[#2168b8] focus:outline-none"
            />
          </div>
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="mt-5 w-full rounded-xl py-3.5 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'var(--primary, #2168b8)' }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}

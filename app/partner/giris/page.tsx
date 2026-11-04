'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Anchor } from 'lucide-react'

export default function PartnerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Giriş başarısız.')
        return
      }
      router.replace('/partner')
      router.refresh()
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-md border border-zinc-200 px-3 py-2.5 text-[16px] text-[#131719] outline-none focus:border-primary'

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
            <Anchor className="h-[18px] w-[18px]" aria-hidden />
          </div>
          <div>
            <h1 className="text-base font-black text-[#131719]">Poseidon Partner</h1>
            <p className="text-xs text-zinc-500">Otel ve iş ortakları girişi</p>
          </div>
        </div>
        <label className="block text-xs font-bold text-zinc-600">
          E-posta
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>
        <label className="mt-3 block text-xs font-bold text-zinc-600">
          Şifre
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </label>
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="mt-4 w-full rounded-md bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
          {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
        <p className="mt-4 text-center text-xs text-zinc-500">Hesabınız yoksa Poseidon ekibiyle iletişime geçin.</p>
      </form>
    </div>
  )
}

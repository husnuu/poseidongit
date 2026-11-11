'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { SERIF } from './fonts'

const inputClass =
  'mt-1.5 h-12 w-full rounded-xl border border-[#dfe3ea] bg-[#fbfaf8] px-4 text-[16px] text-[#0d1b2e] outline-none transition placeholder:text-[#a3aab5] focus:border-[#2168b8] focus:bg-white focus:ring-4 focus:ring-[#2168b8]/10'

export default function PartnerLoginForm({ helpHref }: { helpHref: string | null }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="partner-login-title"
      className="relative w-full rounded-[28px] bg-white p-7 shadow-[0_40px_80px_-30px_rgba(13,27,46,0.35)] ring-1 ring-[#0d1b2e]/[0.06] sm:p-9"
    >
      <h2 id="partner-login-title" className={`${SERIF} text-[28px] font-bold leading-tight text-[#0d1b2e]`}>
        Partner girişi
      </h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[#5b6472]">Panelinize e-posta adresiniz ve şifrenizle girin.</p>

      <label className="mt-7 block text-[13px] font-semibold text-[#2b3443]">
        E-posta
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@oteliniz.com"
          className={inputClass}
        />
      </label>
      <label className="mt-4 block text-[13px] font-semibold text-[#2b3443]">
        Şifre
        <span className="relative block">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            className="absolute right-1.5 top-1/2 mt-[3px] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8a93a1] transition hover:bg-[#f1f2f5] hover:text-[#0d1b2e]"
          >
            {showPassword ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
          </button>
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1b3b72] text-[15px] font-semibold text-white transition hover:bg-[#21488a] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2168b8]/25 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Giriş yapılıyor…
          </>
        ) : (
          <>
            Giriş yap
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>

      <p className="mt-5 text-center text-[13px] leading-relaxed text-[#5b6472]">
        Hesabınız yok mu ya da şifrenizi mi unuttunuz?{' '}
        {helpHref ? (
          <a href={helpHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1b3b72] underline-offset-4 hover:underline">
            Bize yazın
          </a>
        ) : (
          'Poseidon ekibiyle iletişime geçin.'
        )}
      </p>
    </form>
  )
}

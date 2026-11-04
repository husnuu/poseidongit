'use client'

import { useState } from 'react'
import { PartnerCard } from '@/components/partner/PartnerReports'

export default function PartnerSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/partner/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setCurrentPassword('')
        setNewPassword('')
        setMessage({ ok: true, text: 'Şifreniz güncellendi.' })
      } else {
        setMessage({ ok: false, text: json.error ?? 'Şifre güncellenemedi.' })
      }
    } catch {
      setMessage({ ok: false, text: 'Bağlantı hatası.' })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'mt-1 w-full rounded-md border border-zinc-200 px-3 py-2.5 text-[16px] outline-none focus:border-primary'
  return (
    <div className="max-w-md">
      <PartnerCard title="Şifre değiştir">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-xs font-bold text-zinc-600">
            Mevcut şifre
            <input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs font-bold text-zinc-600">
            Yeni şifre (en az 8 karakter)
            <input type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </label>
          {message && (
            <p role="status" className={`text-sm font-semibold ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>
          )}
          <button type="submit" disabled={saving} className="rounded-md bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
            {saving ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
          </button>
        </form>
      </PartnerCard>
    </div>
  )
}

'use client'

import { useState } from 'react'

interface TravelerName {
  firstName: string
  lastName: string
}

interface EditGuestInfoInlineProps {
  bookingId: string
  email: string
  primaryFirstName: string
  primaryLastName: string
  additionalTravelers: TravelerName[]
  onSuccess: (firstName: string, lastName: string, additionalTravelers: TravelerName[]) => void
  onCancel: () => void
}

export default function EditGuestInfoInline({
  bookingId,
  email,
  primaryFirstName,
  primaryLastName,
  additionalTravelers,
  onSuccess,
  onCancel,
}: EditGuestInfoInlineProps) {
  const [firstName, setFirstName] = useState(primaryFirstName)
  const [lastName, setLastName] = useState(primaryLastName)
  const [travelers, setTravelers] = useState<TravelerName[]>(additionalTravelers)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTraveler = (i: number, field: 'firstName' | 'lastName', value: string) => {
    setTravelers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)))
  }

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Ad ve soyad zorunludur.')
      return
    }
    for (const t of travelers) {
      if (!t.firstName.trim() || !t.lastName.trim()) {
        setError('Tüm yolcular için ad ve soyad girilmelidir.')
        return
      }
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/booking/update-guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          additionalTravelers: travelers.map((t) => ({ firstName: t.firstName.trim(), lastName: t.lastName.trim() })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Bilgiler güncellenemedi.')
        return
      }
      onSuccess(firstName.trim(), lastName.trim(), travelers.map((t) => ({ firstName: t.firstName.trim(), lastName: t.lastName.trim() })))
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-[#131719] focus:border-[#2168b8] focus:outline-none'

  return (
    <div className="mt-4 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
      <div className="flex items-center justify-between">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Bilgileri Düzenle</p>
        <button type="button" onClick={onCancel} className="text-xs font-bold text-zinc-400 hover:text-zinc-600">
          Vazgeç
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Ad</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Soyad</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </div>
      </div>

      {travelers.map((t, i) => (
        <div key={i} className="mt-3 grid grid-cols-2 gap-2 border-t border-[#f1f5f9] pt-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Misafir {i + 2} Ad</label>
            <input
              type="text"
              value={t.firstName}
              onChange={(e) => updateTraveler(i, 'firstName', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Misafir {i + 2} Soyad</label>
            <input
              type="text"
              value={t.lastName}
              onChange={(e) => updateTraveler(i, 'lastName', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      ))}

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: 'var(--primary, #2168b8)' }}
      >
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </div>
  )
}

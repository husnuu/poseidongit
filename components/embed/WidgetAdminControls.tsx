'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function WidgetPartnerPicker({
  partners,
  selectedId,
}: {
  partners: { id: string; name: string; slug: string; isActive: boolean }[]
  selectedId: string
}) {
  const router = useRouter()
  return (
    <select
      value={selectedId}
      onChange={(e) => router.push(`/admin/widget?partner=${encodeURIComponent(e.target.value)}`)}
      aria-label="Partner"
      className="h-10 min-w-[240px] rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold"
    >
      {partners.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
          {p.isActive ? '' : ' (pasif)'}
        </option>
      ))}
    </select>
  )
}

/** Widget'ın açılabileceği alan adları — boşsa her sitede açılır. */
export function WidgetDomainsEditor({
  partnerId,
  initial,
  configured,
}: {
  partnerId: string
  initial: string[]
  configured: boolean
}) {
  const [value, setValue] = useState(initial.join('\n'))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/widget`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: value }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ ok: false, text: json.error ?? 'Kaydedilemedi.' })
      } else {
        setValue((json.domains as string[]).join('\n'))
        setMessage({
          ok: true,
          text: json.domains.length > 0 ? 'Kaydedildi. Değişiklik 1 dakika içinde geçerli olur.' : 'Kaydedildi: widget her sitede açılır.',
        })
      }
    } catch {
      setMessage({ ok: false, text: 'Bağlantı hatası.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500">
        Boş bırakılırsa widget her sitede açılır. Alan adı girilirse (her satıra bir tane, örn. <code>otel.com</code>) yalnızca o
        sitede ve alt alan adlarında açılır.
      </p>
      {!configured && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Veritabanında widget_domains sütunu yok: docs/supabase-partners.sql dosyasını tekrar çalıştırın.
        </p>
      )}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="otel.com"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        {message && (
          <span role="status" className={`text-xs font-semibold ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  )
}

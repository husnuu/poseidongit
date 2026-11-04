'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import PartnerAdminForm, { EMPTY_PARTNER_FORM, PARTNER_NEW_CREDENTIALS_KEY, type PartnerFormValues } from '@/components/partner/PartnerAdminForm'
import { PartnerCard } from '@/components/partner/PartnerReports'
import { formatMoney, type PartnerSummary } from '@/lib/partner/commission'

type PartnerRow = {
  id: string
  slug: string
  name: string
  type: string
  commissionRate: number
  isActive: boolean
  totals: PartnerSummary['totals']
}

export default function AdminPartnersPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<PartnerRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners', { credentials: 'include' })
      if (res.status === 401) {
        router.replace('/login?from=/admin/partners')
        return
      }
      const json = await res.json().catch(() => ({}))
      if (!res.ok) setError(json.error ?? 'Partnerler yüklenemedi.')
      else {
        const list = (json.partners ?? []) as PartnerRow[]
        setPartners([...list].sort((a, b) => b.totals.sales - a.totals.sales))
      }
    } catch {
      setError('Bağlantı hatası.')
    }
  }, [router])

  useEffect(() => {
    void load()
  }, [load])

  const create = async (values: PartnerFormValues): Promise<string | null> => {
    const res = await fetch('/api/admin/partners', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return json.error ?? 'Partner oluşturulamadı.'
    // Şifre sunucudan bir daha okunamaz: detay sayfası bir kez göstersin (URL'e yazılmaz).
    window.sessionStorage.setItem(PARTNER_NEW_CREDENTIALS_KEY, JSON.stringify({ email: values.email, password: values.password }))
    router.push(`/admin/partners/${json.id}`)
    return null
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#131719]">Partnerler</h1>
          <p className="text-xs text-zinc-500">Satışa göre sıralı. Komisyon yalnızca gerçekleşmiş turlardan hesaplanır.</p>
        </div>
        <button type="button" onClick={() => setCreating((v) => !v)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-bold text-white hover:opacity-90">
          <Plus className="h-4 w-4" aria-hidden />
          Yeni partner
        </button>
      </div>

      {creating && (
        <PartnerCard title="Yeni partner">
          <PartnerAdminForm initial={EMPTY_PARTNER_FORM} mode="create" submitLabel="Partneri oluştur" onSubmit={create} />
        </PartnerCard>
      )}

      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}

      <PartnerCard>
        {!partners ? (
          <p className="text-sm text-zinc-500">{error ? '' : 'Yükleniyor…'}</p>
        ) : partners.length === 0 ? (
          <p className="text-sm text-zinc-500">Henüz partner yok. “Yeni partner” ile ilk oteli ekleyin.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-bold text-zinc-500">
                  <th className="py-2 pr-3">Partner</th>
                  <th className="py-2 pr-3">Oran</th>
                  <th className="py-2 pr-3">Gerçekleşen rez.</th>
                  <th className="py-2 pr-3">Misafir</th>
                  <th className="py-2 pr-3">Satış</th>
                  <th className="py-2 pr-3">Komisyon</th>
                  <th className="py-2 pr-3">Ödenecek</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-50 last:border-0">
                    <td className="py-2.5 pr-3">
                      <Link href={`/admin/partners/${p.id}`} className="font-bold text-primary hover:underline">{p.name}</Link>
                      {!p.isActive && <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-bold text-zinc-500">Pasif</span>}
                      <p className="text-xs text-zinc-400">/p/{p.slug}</p>
                    </td>
                    <td className="py-2.5 pr-3">%{p.commissionRate}</td>
                    <td className="py-2.5 pr-3">{p.totals.bookings}</td>
                    <td className="py-2.5 pr-3">{p.totals.guests}</td>
                    <td className="py-2.5 pr-3">{formatMoney(p.totals.sales)}</td>
                    <td className="py-2.5 pr-3">{formatMoney(p.totals.earned)}</td>
                    <td className="py-2.5 pr-3 font-bold">{formatMoney(p.totals.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PartnerCard>
    </div>
  )
}

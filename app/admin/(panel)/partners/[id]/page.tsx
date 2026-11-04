'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import PartnerAdminForm, { PARTNER_NEW_CREDENTIALS_KEY, type PartnerFormValues } from '@/components/partner/PartnerAdminForm'
import PartnerShareKit from '@/components/partner/PartnerShareKit'
import { PartnerBookings, PartnerCard, PartnerMonths, PartnerStats } from '@/components/partner/PartnerReports'
import { partnerPagePath } from '@/lib/partner/links'
import type { PartnerBookingView, PartnerPeriodSummary, PartnerSummary } from '@/lib/partner/commission'
import type { PartnerAccount } from '@/lib/partner/partners'

type Detail = {
  baseUrl: string
  partner: PartnerAccount
  summary: PartnerSummary
  bookings: PartnerBookingView[]
}

export default function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null)

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(PARTNER_NEW_CREDENTIALS_KEY)
      window.sessionStorage.removeItem(PARTNER_NEW_CREDENTIALS_KEY)
      if (raw) setNewCredentials(JSON.parse(raw))
    } catch {
      /* sessionStorage kapalıysa bilgi kutusu gösterilmez */
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/partners/${id}`, { credentials: 'include' })
      if (res.status === 401) {
        router.replace(`/login?from=/admin/partners/${id}`)
        return
      }
      const json = await res.json().catch(() => ({}))
      if (!res.ok) setError(json.error ?? 'Partner yüklenemedi.')
      else setDetail(json as Detail)
    } catch {
      setError('Bağlantı hatası.')
    }
  }, [id, router])

  useEffect(() => {
    void load()
  }, [load])

  const patch = async (body: Record<string, unknown>): Promise<string | null> => {
    const res = await fetch(`/api/admin/partners/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return json.error ?? 'Kaydedilemedi.'
    await load()
    return null
  }

  const save = ({ slug: _slug, password, ...fields }: PartnerFormValues) =>
    patch({ ...fields, ...(password ? { password } : {}) })

  const togglePayout = async (m: PartnerPeriodSummary) => {
    const paid = m.paid > 0 && m.due <= 0
    const res = await fetch(`/api/admin/partners/${id}/payouts${paid ? `?period=${m.period}` : ''}`, {
      method: paid ? 'DELETE' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...(paid ? {} : { body: JSON.stringify({ period: m.period }) }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) setError(json.error ?? 'İşlem yapılamadı.')
    else await load()
  }

  if (error && !detail) return <p role="alert" className="p-6 text-sm font-semibold text-red-600">{error}</p>
  if (!detail) return <p className="p-6 text-sm text-zinc-500">Yükleniyor…</p>
  const { partner, summary, bookings, baseUrl } = detail

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-6">
      <div className="print:hidden">
        <Link href="/admin/partners" className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Partnerler
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="break-words text-xl font-black text-[#131719]">{partner.name}</h1>
          <div className="flex flex-wrap gap-2">
            <a href={partnerPagePath(partner.slug)} target="_blank" rel="noopener noreferrer" className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50">
              Mini sayfayı aç
            </a>
            <button
              type="button"
              onClick={() => void patch({ isActive: !partner.isActive })}
              className={`rounded-md border px-3 py-2 text-xs font-bold ${
                partner.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {partner.isActive ? 'Pasife al' : 'Aktifleştir'}
            </button>
          </div>
        </div>
        {!partner.isActive && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Bu partner pasif: mini sayfası kapalı, giriş yapamaz ve yeni rezervasyon yazılmaz. Geçmiş kayıtlar durur.
          </p>
        )}
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}

      {newCredentials && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 print:hidden">
          <p className="font-black">Partner oluşturuldu. Giriş bilgilerini şimdi iletin; şifre bir daha gösterilmez.</p>
          <p className="mt-2 break-all">
            Giriş adresi: <b>{baseUrl.replace(/\/$/, '')}/partner/giris</b>
            <br />
            E-posta: <b>{newCredentials.email}</b>
            <br />
            Şifre: <b>{newCredentials.password}</b>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5 print:hidden">
        <PartnerStats totals={summary.totals} />
        <PartnerCard title="Aylık komisyon">
          <PartnerMonths
            months={summary.months}
            renderAction={(m) =>
              m.commission > 0 || m.paid > 0 ? (
                <button type="button" onClick={() => void togglePayout(m)} className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-bold hover:bg-zinc-50">
                  {m.paid > 0 && m.due <= 0 ? 'Geri al' : 'Ödendi işaretle'}
                </button>
              ) : null
            }
          />
        </PartnerCard>
      </div>

      <PartnerShareKit slug={partner.slug} name={partner.name} logoData={partner.logoData} baseUrl={baseUrl} />

      <div className="flex flex-col gap-5 print:hidden">
        <PartnerCard title="Rezervasyonlar">
          <PartnerBookings bookings={bookings} />
        </PartnerCard>
        <PartnerCard title="Partner bilgileri">
          <PartnerAdminForm
            key={partner.passwordChangedAt}
            mode="edit"
            submitLabel="Değişiklikleri kaydet"
            onSubmit={save}
            initial={{
              name: partner.name,
              slug: partner.slug,
              type: partner.type,
              email: partner.email,
              commissionRate: partner.commissionRate,
              logoData: partner.logoData,
              welcomeMessage: partner.welcomeMessage ?? '',
              contactName: partner.contactName ?? '',
              contactPhone: partner.contactPhone ?? '',
              adminNote: partner.adminNote ?? '',
              password: '',
            }}
          />
        </PartnerCard>
      </div>
    </div>
  )
}

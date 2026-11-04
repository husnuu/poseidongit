'use client'

import { PartnerBookings, PartnerCard, PartnerMonths, PartnerStats } from '@/components/partner/PartnerReports'
import { usePartnerData } from '@/components/partner/usePartnerData'

export default function PartnerOverviewPage() {
  const { data, error } = usePartnerData()
  if (error) return <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>
  if (!data) return <p className="text-sm text-zinc-500">Yükleniyor…</p>
  const { summary, bookings, partner } = data
  return (
    <div className="flex flex-col gap-5">
      <PartnerStats totals={summary.totals} />
      <p className="text-xs text-zinc-500">
        Komisyon oranınız %{partner.commissionRate}. Komisyon, iptal veya iade edilmeyen turlar gerçekleştikten sonra kazanılır ve aylık hesaplanır.
      </p>
      <PartnerCard title="Aylık komisyon">
        <PartnerMonths months={summary.months} />
      </PartnerCard>
      <PartnerCard title="Rezervasyonlar">
        <PartnerBookings bookings={bookings} />
      </PartnerCard>
    </div>
  )
}

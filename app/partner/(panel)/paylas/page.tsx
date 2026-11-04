'use client'

import PartnerShareKit from '@/components/partner/PartnerShareKit'
import { usePartnerData } from '@/components/partner/usePartnerData'

export default function PartnerSharePage() {
  const { data, error } = usePartnerData()
  if (error) return <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>
  if (!data) return <p className="text-sm text-zinc-500">Yükleniyor…</p>
  return (
    <PartnerShareKit
      slug={data.partner.slug}
      name={data.partner.name}
      logoData={data.partner.logoData}
      baseUrl={data.baseUrl}
    />
  )
}

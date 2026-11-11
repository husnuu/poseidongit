import { redirect } from 'next/navigation'
import { getPartnerFromSession } from '@/lib/partner/session'
import { getPartnerWidgetDomains } from '@/lib/partner/partners'
import { loadWidgetTourOptions } from '@/lib/embed/builderData'
import WidgetBuilder from '@/components/embed/WidgetBuilder'

export const dynamic = 'force-dynamic'

export default async function PartnerWidgetPage() {
  const partner = await getPartnerFromSession().catch(() => null)
  if (!partner) redirect('/partner/giris')
  const [tours, domainInfo] = await Promise.all([loadWidgetTourOptions(), getPartnerWidgetDomains(partner.id)])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-black text-[#131719]">Web sitesi widget&apos;ı</h1>
        <p className="text-sm text-zinc-500">
          Turlarımızı kendi web sitenizde gösterin. Misafirleriniz sitenizden ayrılmadan tur seçer ve rezervasyon yapar; satışlar
          komisyonunuza yazılır.
        </p>
      </div>
      <WidgetBuilder partnerSlug={partner.slug} partnerName={partner.name} tours={tours} domains={domainInfo.domains} />
    </div>
  )
}

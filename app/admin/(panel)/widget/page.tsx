import Link from 'next/link'
import { listPartnerAccounts, getPartnerWidgetDomains, partnerSetupErrorMessage, type PartnerAccount } from '@/lib/partner/partners'
import { loadWidgetTourOptions } from '@/lib/embed/builderData'
import WidgetBuilder from '@/components/embed/WidgetBuilder'
import { WidgetDomainsEditor, WidgetPartnerPicker } from '@/components/embed/WidgetAdminControls'

export const dynamic = 'force-dynamic'

/** Admin: her partnerin web sitesi widget'ı — önizleme, kod ve alan adı kısıtlaması. */
export default async function AdminWidgetPage({ searchParams }: { searchParams: Promise<{ partner?: string }> }) {
  const { partner: selectedParam } = await searchParams

  let partners: PartnerAccount[] = []
  let loadError: string | null = null
  try {
    partners = await listPartnerAccounts()
  } catch (e) {
    loadError = partnerSetupErrorMessage(e)
  }
  const selected = partners.find((p) => p.id === selectedParam) ?? partners.find((p) => p.isActive) ?? partners[0]
  const [tours, domainInfo] = selected
    ? await Promise.all([loadWidgetTourOptions(), getPartnerWidgetDomains(selected.id)])
    : [[], { domains: [], configured: true }]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#131719]">Web sitesi widget&apos;ı</h1>
          <p className="text-xs text-zinc-500">
            Partnerlerin kendi sitelerine gömdüğü tur ve rezervasyon widget&apos;ı. Satışlar partnere &quot;Web sitesi widget&quot; kanalıyla yazılır.
          </p>
        </div>
        {selected && (
          <WidgetPartnerPicker
            partners={partners.map((p) => ({ id: p.id, name: p.name, slug: p.slug, isActive: p.isActive }))}
            selectedId={selected.id}
          />
        )}
      </div>

      {loadError && <p role="alert" className="text-sm font-semibold text-red-600">{loadError}</p>}

      {!loadError && !selected && (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Henüz partner yok. Widget kodu partner hesabına bağlıdır:{' '}
          <Link href="/admin/partners" className="font-bold text-primary hover:underline">
            önce partner oluşturun
          </Link>
          .
        </p>
      )}

      {selected && !selected.isActive && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          Bu partner pasif: widget&apos;ı sitesinde açılmaz. Önizleme de &quot;bulunamadı&quot; gösterir.
        </p>
      )}

      {selected && (
        <WidgetBuilder
          key={selected.id}
          partnerSlug={selected.slug}
          partnerName={selected.name}
          tours={tours}
          domainsSlot={
            <WidgetDomainsEditor partnerId={selected.id} initial={domainInfo.domains} configured={domainInfo.configured} />
          }
        />
      )}
    </div>
  )
}

import type { Metadata } from 'next'
import { client, urlFor } from '@/lib/sanity'
import { siteSettingsLogoQuery, siteSettingsWhatsappQuery } from '@/lib/queries'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'
import PartnerLanding from '@/components/partner/landing/PartnerLanding'
import type { LandingTour } from '@/components/partner/landing/PartnerHowItWorks'

export const metadata: Metadata = { title: 'Partner girişi · Poseidon' }
export const revalidate = 600

/** Tanıtımdaki küçük görseller ve telefon önizlemesi için gerçek turlar. */
const LANDING_TOURS_QUERY = `*[_type == "tour" && defined(slug.current) && defined(mainImage.asset) && !(_id in path("drafts.**"))]
  | order(coalesce(isPopular, false) desc, _updatedAt desc)[0...3]{ _id, title, mainImage{ asset } }`

const PARTNER_CONTACT_TEXT = 'Merhaba, Poseidon partner programı hakkında bilgi almak istiyorum.'

export default async function PartnerLoginPage() {
  const [logoRow, waRow, tourRows] = await Promise.all([
    client
      .fetch<{ siteName?: string | null; logo?: { url?: string | null; alt?: string | null } | null } | null>(siteSettingsLogoQuery)
      .catch(() => null),
    client.fetch<{ whatsapp?: string | null } | null>(siteSettingsWhatsappQuery).catch(() => null),
    client
      .fetch<Array<{ _id: string; title?: string | null; mainImage?: { asset?: unknown } | null }>>(LANDING_TOURS_QUERY)
      .catch(() => []),
  ])

  const wa = buildWhatsAppHref(waRow?.whatsapp ?? null)
  const contactHref = wa ? `${wa}?text=${encodeURIComponent(PARTNER_CONTACT_TEXT)}` : null

  const tours: LandingTour[] = (tourRows ?? []).map((t) => ({
    id: t._id,
    title: (t.title ?? '').trim(),
    imageUrl: t.mainImage?.asset
      ? urlFor(t.mainImage.asset as Parameters<typeof urlFor>[0]).width(480).height(480).fit('crop').auto('format').url()
      : null,
  }))

  return (
    <PartnerLanding
      logoUrl={logoRow?.logo?.url ?? null}
      logoAlt={logoRow?.logo?.alt?.trim() || logoRow?.siteName?.trim() || 'Poseidon'}
      contactHref={contactHref}
      tours={tours}
    />
  )
}

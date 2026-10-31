import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { yachtRentalByLocationAndSlugQuery } from '@/lib/yachtQueries'
import { siteFooterQuery } from '@/lib/queries'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import YachtDetailView from '@/components/yacht/YachtDetailView'
import { buildYachtDetailMetadata } from '@/lib/yachtMetadata'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { translateYachtRentalDocument } from '@/lib/yachtTranslate'
import { buildWhatsAppLink } from '@/lib/whatsapp'

const getYacht = cache(async (locationSlug: string, yachtSlug: string) => {
  try {
    return await client.fetch<YachtRentalDocument | null>(
      yachtRentalByLocationAndSlugQuery,
      { locationSlug, yachtSlug },
      { useCdn: true }
    )
  } catch (err) {
    console.error('[yat-kiralama] Sanity fetch failed', { locationSlug, yachtSlug, err })
    return null
  }
})

/** Yat detay sayfaları build'de üretilir. [segment] klasöründe layout olmadığı için
 *  üst parametre buraya gelmez — lokasyon + yat slug'ı birlikte döndürülür. */
export async function generateStaticParams() {
  const rows = await client
    .fetch<{ segment?: string | null; yachtSlug?: string | null }[]>(
      `*[_type == "yachtRental" && isActive == true && defined(slug.current) && defined(location->slug.current)]{
        "segment": location->slug.current, "yachtSlug": slug.current
      }`
    )
    .catch(() => [] as { segment?: string | null; yachtSlug?: string | null }[])
  return rows
    .filter((r): r is { segment: string; yachtSlug: string } => Boolean(r.segment && r.yachtSlug))
    .map(({ segment, yachtSlug }) => ({ segment, yachtSlug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; segment: string; yachtSlug: string }>
}): Promise<Metadata> {
  const { locale: loc, segment, yachtSlug } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const yacht = await getYacht(segment, yachtSlug)
  if (!yacht) return { title: 'Yat bulunamadı' }
  const path = `/yat-kiralama/${segment}/${yachtSlug}`
  try {
    return buildYachtDetailMetadata(yacht, path, locale)
  } catch (err) {
    console.error('[yat-kiralama] generateMetadata failed', { segment, yachtSlug, err })
    return { title: yacht.name || 'Yat kiralama' }
  }
}

export default async function YatKiralamaLocationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; segment: string; yachtSlug: string }>
}) {
  const { locale: loc, segment, yachtSlug } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const yacht = await getYacht(segment, yachtSlug)
  if (!yacht) notFound()
  const path = `/yat-kiralama/${segment}/${yachtSlug}`
  const translatedYacht = await translateYachtRentalDocument(yacht, locale)

  let whatsappUrl: string | null = null
  try {
    const footer = await client.fetch<{ contact?: { chatValue?: string | null } | null } | null>(
      siteFooterQuery,
      {},
      { useCdn: false }
    )
    whatsappUrl = buildWhatsAppLink(footer?.contact?.chatValue ?? null)
  } catch {
    whatsappUrl = null
  }

  return <YachtDetailView locale={locale} yacht={translatedYacht} path={path} whatsappUrl={whatsappUrl} />
}

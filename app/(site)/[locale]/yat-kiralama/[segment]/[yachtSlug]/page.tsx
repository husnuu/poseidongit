import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { yachtRentalByLocationAndSlugQuery } from '@/lib/yachtQueries'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import YachtDetailView from '@/components/yacht/YachtDetailView'
import { buildYachtDetailMetadata } from '@/lib/yachtMetadata'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'

/** Root layout `headers()` kullandığı için ISR/statik ön üretim ile çakışmayı önler (prod: DYNAMIC_SERVER_USAGE). */
export const dynamic = 'force-dynamic'

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; segment: string; yachtSlug: string }>
}): Promise<Metadata> {
  const { segment, yachtSlug } = await params
  const yacht = await getYacht(segment, yachtSlug)
  if (!yacht) return { title: 'Yat bulunamadı' }
  const path = `/yat-kiralama/${segment}/${yachtSlug}`
  try {
    return buildYachtDetailMetadata(yacht, path)
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
  return <YachtDetailView locale={locale} yacht={yacht} path={path} />
}

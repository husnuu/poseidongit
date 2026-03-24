import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { yachtRentalByLocationAndSlugQuery, yachtRentalSlugsQuery } from '@/lib/yachtQueries'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import YachtDetailView from '@/components/yacht/YachtDetailView'
import { buildYachtDetailMetadata } from '@/lib/yachtMetadata'

export const revalidate = 3600

const getYacht = cache(async (locationSlug: string, yachtSlug: string) => {
  return client.fetch<YachtRentalDocument | null>(
    yachtRentalByLocationAndSlugQuery,
    { locationSlug, yachtSlug },
    { useCdn: true }
  )
})

export async function generateStaticParams() {
  try {
    const list = await client.fetch<{ slug: string | null; locationSlug?: string | null }[]>(
      yachtRentalSlugsQuery
    )
    const out: { segment: string; yachtSlug: string }[] = []
    for (const row of list ?? []) {
      if (row.slug && row.locationSlug) {
        out.push({ segment: row.locationSlug, yachtSlug: row.slug })
      }
    }
    return out
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segment: string; yachtSlug: string }>
}): Promise<Metadata> {
  const { segment, yachtSlug } = await params
  const yacht = await getYacht(segment, yachtSlug)
  if (!yacht) return { title: 'Yat bulunamadı' }
  const path = `/yat-kiralama/${segment}/${yachtSlug}`
  return buildYachtDetailMetadata(yacht, path)
}

export default async function YatKiralamaLocationDetailPage({
  params,
}: {
  params: Promise<{ segment: string; yachtSlug: string }>
}) {
  const { segment, yachtSlug } = await params
  const yacht = await getYacht(segment, yachtSlug)
  if (!yacht) notFound()
  const path = `/yat-kiralama/${segment}/${yachtSlug}`
  return <YachtDetailView yacht={yacht} path={path} />
}

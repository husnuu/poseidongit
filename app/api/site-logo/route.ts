import { NextResponse } from 'next/server'
import { client, safeSanityImageUrl } from '@/lib/sanity'
import { siteSettingsLogoQuery } from '@/lib/queries'

export const revalidate = 3600

type Row = {
  siteName?: string | null
  logo?: { asset?: { _ref?: string }; url?: string; alt?: string | null } | null
} | null

/** Sitenin logosu (header/footer ile aynı kaynak: siteSettings.logo) —
    istemci bileşenleri (ör. rezervasyon bileti) için aynı origin'den. */
export async function GET() {
  try {
    const row = await client.fetch<Row>(siteSettingsLogoQuery)
    const url = safeSanityImageUrl(row?.logo?.asset, (b) => b.width(360).fit('max')) ?? row?.logo?.url ?? null
    return NextResponse.json(
      { url, alt: row?.logo?.alt?.trim() || row?.siteName?.trim() || null },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    )
  } catch {
    return NextResponse.json({ url: null, alt: null }, { status: 200 })
  }
}

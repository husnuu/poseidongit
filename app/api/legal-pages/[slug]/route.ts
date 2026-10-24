import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { legalPageBySlugQuery } from '@/lib/queries'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { mergeLegalPageForLocale } from '@/lib/i18n/mergeLegalPageForLocale'

/**
 * Tek bir yasal sayfanın başlığı ve içeriği — rezervasyon formundaki sözleşme
 * bağlantıları yeni sekme yerine pop-up'ta açılsın diye. Yasal sayfa
 * (/yasal/[slug]) ile aynı sorgu ve aynı dil birleştirmesi kullanılıyor.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const url = new URL(req.url)
  const loc = url.searchParams.get('locale') ?? 'tr'
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const slugNorm = decodeURIComponent(slug).trim().toLowerCase()

  try {
    const raw = await client.fetch<Record<string, unknown> | null>(
      legalPageBySlugQuery,
      { slug: slugNorm },
      { useCdn: false }
    )
    if (!raw) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const page = mergeLegalPageForLocale(raw, locale)
    return NextResponse.json({
      title: (page.title as string | undefined) ?? '',
      content: page.content ?? [],
    })
  } catch (e) {
    console.error('Legal page fetch error:', e)
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }
}

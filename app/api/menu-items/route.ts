/**
 * GET /api/menu-items?locale=tr
 * Tekne barı menüsü — rezervasyon onay sayfasındaki "Bar menüsünü gör" popup'ı
 * istemci tarafında bu endpoint'ten veri çeker (bkz. components/booking-confirmation/BarMenuModal.tsx).
 * /menu sayfasıyla aynı Sanity sorgusunu kullanır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { client, safeSanityImageUrl } from '@/lib/sanity'
import { menuItemsQuery } from '@/lib/queries'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { translateText } from '@/lib/i18n/runtimeTranslate'
import type { MenuItemCard } from '@/components/menu/MenuPageClient'

export const revalidate = 60

type MenuItemRaw = {
  _id: string
  title: string
  category: string
  price: number
  description?: string | null
  inStock?: boolean | null
  image?: {
    asset?: { _ref?: string; _type?: string }
    alt?: string | null
    metadata?: { lqip?: string | null }
  } | null
}

async function mapItem(raw: MenuItemRaw, locale: SiteLocale): Promise<MenuItemCard> {
  const [title, description] = await Promise.all([
    translateText(raw.title, locale),
    raw.description ? translateText(raw.description, locale) : Promise.resolve(raw.description ?? null),
  ])
  return {
    _id: raw._id,
    title: title || raw.title,
    category: raw.category,
    price: raw.price,
    description,
    inStock: raw.inStock !== false,
    imageUrl: safeSanityImageUrl(raw.image, (b) => b.width(720).height(540).fit('crop').auto('format')),
    imageAlt: raw.image?.alt ?? null,
    lqip: raw.image?.metadata?.lqip ?? null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const loc = request.nextUrl.searchParams.get('locale')?.trim() ?? 'tr'
    const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'

    let raw: MenuItemRaw[] = []
    try {
      raw = await client.fetch<MenuItemRaw[]>(menuItemsQuery)
    } catch {
      raw = []
    }
    const items = await Promise.all((raw ?? []).map((r) => mapItem(r, locale)))

    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
    )
  } catch (e) {
    console.error('[menu-items]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

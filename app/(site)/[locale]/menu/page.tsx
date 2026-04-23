import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MenuPageClient, { type MenuItemCard } from '@/components/menu/MenuPageClient'
import { client, safeSanityImageUrl } from '@/lib/sanity'
import { menuItemsQuery } from '@/lib/queries'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

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

function mapItem(raw: MenuItemRaw): MenuItemCard {
  return {
    _id: raw._id,
    title: raw.title,
    category: raw.category,
    price: raw.price,
    description: raw.description,
    inStock: raw.inStock !== false,
    imageUrl: safeSanityImageUrl(raw.image, (b) =>
      b.width(720).height(540).fit('crop').auto('format'),
    ),
    imageAlt: raw.image?.alt ?? null,
    lqip: raw.image?.metadata?.lqip ?? null,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const path = withLocalePath(locale, '/menu')
  const canonical = path === '/' ? getBaseUrl() : `${getBaseUrl()}${path}`
  const site = getSiteName()

  const titles: Record<SiteLocale, string> = {
    tr: 'Tekne menüsü',
    en: 'Yacht menu',
    de: 'Yacht-Menü',
  }
  const descs: Record<SiteLocale, string> = {
    tr: 'Poseidon tekne menüsü: içecekler, atıştırmalıklar ve gurme tabaklar.',
    en: 'Poseidon yacht menu: drinks, snacks and gourmet plates.',
    de: 'Poseidon-Yachtmenü: Getränke, Snacks und Gourmetteller.',
  }

  return {
    title: titles[locale],
    description: descs[locale],
    alternates: { canonical },
    openGraph: {
      title: `${titles[locale]}${site ? ` | ${site}` : ''}`,
      description: descs[locale],
      url: canonical,
    },
  }
}

export default async function MenuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()

  let raw: MenuItemRaw[] = []
  try {
    raw = await client.fetch<MenuItemRaw[]>(menuItemsQuery)
  } catch {
    raw = []
  }

  const items = (raw ?? []).map(mapItem)

  return <MenuPageClient items={items} />
}

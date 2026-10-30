import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MenuPageClient, { type MenuItemCard } from '@/components/menu/MenuPageClient'
import { client, safeSanityImageUrl } from '@/lib/sanity'
import { menuItemsQuery } from '@/lib/queries'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import { buildMenuSchema, buildStandardPageLd } from '@/lib/seo/pageSchemas'
import { absoluteUrl } from '@/lib/seo'
import { withLocalePath } from '@/lib/i18n/paths'
import JsonLd from '@/components/seo/JsonLd'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { translateText } from '@/lib/i18n/runtimeTranslate'

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
    imageUrl: safeSanityImageUrl(raw.image, (b) =>
      b.width(720).height(540).fit('crop').auto('format'),
    ),
    imageAlt: raw.image?.alt ?? null,
    lqip: raw.image?.metadata?.lqip ?? null,
  }
}

const MENU_TITLES: Record<SiteLocale, string> = {
  tr: 'Tekne Menüsü ve Fiyatlar: İçecekler ve Tatlılar',
  en: 'On-Board Menu & Prices: Drinks and Desserts',
  de: 'Bordmenü & Preise: Getränke und Desserts',
  ru: 'Меню и цены на борту: напитки и десерты',
}
const MENU_DESCRIPTIONS: Record<SiteLocale, string> = {
  tr: 'Poseidon teknesindeki menü ve fiyatlar: kokteyller, mocktailler, bira ve şarap, soğuk ve sıcak kahveler, çaylar, dondurma ve tatlılar.',
  en: 'Menu and prices on board Poseidon: cocktails, mocktails, beer and wine, iced and hot coffee, tea, ice cream and desserts.',
  de: 'Menü und Preise an Bord der Poseidon: Cocktails, Mocktails, Bier und Wein, Eis- und Heißkaffee, Tee, Eis und Desserts.',
  ru: 'Меню и цены на борту Poseidon: коктейли, моктейли, пиво и вино, холодный и горячий кофе, чай, мороженое и десерты.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  return buildPageMetadata({ locale, path: '/menu', title: MENU_TITLES[locale], description: MENU_DESCRIPTIONS[locale] })
}

export default async function MenuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale

  let raw: MenuItemRaw[] = []
  try {
    raw = await client.fetch<MenuItemRaw[]>(menuItemsQuery)
  } catch {
    raw = []
  }

  const items = await Promise.all((raw ?? []).map((r) => mapItem(r, locale)))

  const menuName = MENU_TITLES[locale]
  const menuUrl = absoluteUrl(withLocalePath(locale, '/menu'))
  const pageLd = buildStandardPageLd({
    type: 'WebPage',
    locale,
    url: menuUrl,
    homeUrl: withLocalePath(locale, '/'),
    name: menuName,
    description: MENU_DESCRIPTIONS[locale],
  })
  const menuLd = buildMenuSchema({
    url: menuUrl,
    name: menuName,
    locale,
    items: items.map((i) => ({
      name: i.title,
      description: i.description,
      price: i.price,
      image: i.imageUrl,
      inStock: i.inStock,
    })),
  })

  return (
    <>
      {pageLd.map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <JsonLd data={menuLd} />
      <MenuPageClient items={items} locale={locale} />
    </>
  )
}

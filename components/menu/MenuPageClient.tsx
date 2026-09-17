'use client'

import Image from 'next/image'
import {
  Beer,
  BottleWine,
  Cake,
  Coffee,
  CupSoda,
  GlassWater,
  IceCream,
  LayoutGrid,
  LeafyGreen,
  type LucideIcon,
  Martini,
  Ship,
  ThermometerSnowflake,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import styles from './MenuPageClient.module.css'

export type MenuItemCard = {
  _id: string
  title: string
  category: string
  price: number
  description?: string | null
  inStock: boolean
  imageUrl: string | null
  imageAlt?: string | null
  lqip?: string | null
}

const ICON_STROKE = 2

/** Sekmede kısa etiket; kartta tam kategori metni (Sanity ile aynı). */
const CATEGORY_TABS: {
  value: string | null
  tabLabel: string
  cardLabel: string | null
  Icon: LucideIcon
}[] = [
  { value: null, tabLabel: 'Tümü', cardLabel: null, Icon: LayoutGrid },
  {
    value: 'kokteyller',
    tabLabel: 'Kokteyller',
    cardLabel: 'Kokteyller (Margarita, Mojito vb.)',
    Icon: Martini,
  },
  { value: 'mocktails', tabLabel: 'Mocktails', cardLabel: 'Mocktails', Icon: GlassWater },
  {
    value: 'alkollu_icecekler',
    tabLabel: 'Bira & Şarap',
    cardLabel: 'Alkollü içecekler',
    Icon: Beer,
  },
  {
    value: 'soft_icecekler',
    tabLabel: 'Soft içecek',
    cardLabel: 'Soft içecekler',
    Icon: CupSoda,
  },
  { value: 'siseler', tabLabel: 'Şişeler', cardLabel: 'Şişeler', Icon: BottleWine },
  {
    value: 'soguk_kahveler',
    tabLabel: 'Soğuk kahve',
    cardLabel: 'Soğuk Kahveler',
    Icon: ThermometerSnowflake,
  },
  {
    value: 'sicak_kahveler',
    tabLabel: 'Sıcak kahve',
    cardLabel: 'Sıcak Kahveler',
    Icon: Coffee,
  },
  {
    value: 'premium_caylar',
    tabLabel: 'Premium çay',
    cardLabel: 'Premium Çaylar',
    Icon: LeafyGreen,
  },
  { value: 'dondurmalar', tabLabel: 'Dondurma', cardLabel: 'Dondurmalar', Icon: IceCream },
  { value: 'tatlilar', tabLabel: 'Tatlı', cardLabel: 'Tatlılar', Icon: Cake },
]

function categoryLabel(value: string): string {
  return CATEGORY_TABS.find((t) => t.value === value)?.cardLabel ?? value
}

function formatTry(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(price)
}

export default function MenuPageClient({ items }: { items: MenuItemCard[] }) {
  const [active, setActive] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (active == null) return items
    return items.filter((i) => i.category === active)
  }, [items, active])

  return (
    <div className="bg-white pb-16 pt-10 md:pt-14">
      <div className="mx-auto max-w-3xl px-4">
        <header className="mb-8 text-center">
          <h1
            className="text-[32px] font-extrabold uppercase leading-[1.15] sm:text-[40px]"
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              color: 'var(--primary, #2168b8)',
            }}
          >
            Tekne Menüsü
          </h1>
          <p
            className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed"
            style={{ color: 'var(--text-color, #58595b)' }}
          >
            Lüks tekne konseptine uygun içecek ve atıştırmalıklar. Kategoriye dokunarak filtreleyin.
          </p>
        </header>

        <div className={styles.navScroll}>
          <nav className={styles.nav} aria-label="Menü kategorileri">
            {CATEGORY_TABS.map((tab) => {
              const selected = active === tab.value
              const Icon = tab.Icon
              return (
                <button
                  key={tab.value ?? 'all'}
                  type="button"
                  onClick={() => setActive(tab.value)}
                  className={styles.categoryTab}
                  style={
                    selected
                      ? { background: 'var(--primary, #2168b8)', borderColor: 'var(--primary, #2168b8)', color: '#fff' }
                      : { background: '#fff', borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
                  <span>{tab.tabLabel}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-500">
            Bu kategoride henüz ürün yok.
          </p>
        ) : (
          <ul className="flex flex-col">
            {filtered.map((item, index) => (
              <li key={item._id}>
                <article
                  className="flex items-center gap-4 py-4"
                  style={{
                    borderTop: index === 0 ? 'none' : '1px solid #f1f5f9',
                    opacity: item.inStock ? 1 : 0.6,
                  }}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-[72px] sm:w-[72px]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt || item.title}
                        fill
                        className="object-cover"
                        sizes="72px"
                        placeholder={item.lqip ? 'blur' : 'empty'}
                        blurDataURL={item.lqip ?? undefined}
                      />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center"
                        style={{ color: 'var(--muted, #81848b)' }}
                      >
                        <Ship className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-base font-bold"
                      style={{ color: 'var(--secondary, #131719)' }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--muted, #81848b)' }}
                    >
                      {categoryLabel(item.category)}
                    </p>
                    {item.description ? (
                      <p
                        className="mt-1 line-clamp-2 text-sm leading-relaxed"
                        style={{ color: 'var(--text-color, #58595b)' }}
                      >
                        {item.description}
                      </p>
                    ) : null}
                    {!item.inStock && (
                      <span
                        className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ background: 'var(--secondary, #131719)' }}
                      >
                        Tükendi
                      </span>
                    )}
                  </div>

                  <div
                    className="shrink-0 text-lg font-extrabold tabular-nums sm:text-xl"
                    style={{ color: 'var(--primary, #2168b8)' }}
                  >
                    {formatTry(item.price)}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

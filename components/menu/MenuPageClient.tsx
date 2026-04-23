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
  Wine,
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

const ICON_STROKE = 1.75
const ICON_SIZE = 'h-4 w-4'

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
    tabLabel: 'Alkollü içecek',
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
    <div className="pb-16 pt-6">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Poseidon · Çeşme
          </p>
          <h1 className="mt-2 bg-gradient-to-r from-[#0f2744] via-[#1e3a5f] to-[#0f2744] bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            Tekne Menüsü
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-600">
            Lüks tekne konseptine uygun içecek ve atıştırmalıklar. Kategoriye dokunarak
            filtreleyin.
          </p>
        </header>

        <nav className={styles.nav} aria-label="Menü kategorileri">
          {CATEGORY_TABS.map((tab) => {
            const selected = active === tab.value
            const Icon = tab.Icon
            return (
              <button
                key={tab.value ?? 'all'}
                type="button"
                onClick={() => setActive(tab.value)}
                className={`${styles.categoryTab} ${
                  selected ? styles.categoryTabSelected : styles.categoryTabIdle
                }`}
              >
                <span
                  className={`${styles.iconWrap} ${
                    selected ? styles.iconWrapSelected : styles.iconWrapIdle
                  }`}
                  aria-hidden
                >
                  <Icon className={ICON_SIZE} strokeWidth={ICON_STROKE} />
                </span>
                <span
                  className={`${styles.tabLabel} ${
                    selected ? styles.tabLabelSelected : styles.tabLabelIdle
                  }`}
                >
                  {tab.tabLabel}
                </span>
              </button>
            )
          })}
        </nav>

        <section
          className="relative mx-auto mb-12 max-w-3xl overflow-hidden rounded-[1.75rem] border border-rose-200/35 bg-gradient-to-br from-rose-50/95 via-pink-50/90 to-rose-100/70 shadow-[0_12px_40px_-12px_rgba(15,39,68,0.08)] md:rounded-[2rem]"
          aria-labelledby="menu-offer-heading"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_20%,rgba(251,207,232,0.35),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_100%,rgba(254,226,226,0.4),transparent)]" />
          <div className="relative z-[1] flex flex-col gap-8 px-6 py-8 sm:px-8 sm:py-10 md:flex-row md:items-center md:gap-10 md:px-10 md:py-12 lg:px-14">
            <div className="min-w-0 flex-1 border-l-[3px] border-[#c9a227] pl-5 sm:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-900/55">
                Sınırlı süre
              </p>
              <h2
                id="menu-offer-heading"
                className="mt-2 text-2xl font-bold tracking-tight text-[#0f2744] md:text-3xl"
              >
                Tekneye Özel Teklif
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-600 md:text-base md:leading-relaxed">
                Günlük turlarda ve özel kiralamalarda menü paketlerimizden yararlanın. Detaylar
                için ekibimizle iletişime geçin.
              </p>
            </div>
            <div className="relative flex shrink-0 items-center justify-center md:w-[min(42%,220px)] lg:w-[240px]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rose-50/0 via-transparent to-transparent md:rounded-2xl" />
              {/* `public/image_2.png` — şeffaf PNG veya yumuşak kenarlı fotoğraf önerilir */}
              <img
                src="/image_2.png"
                alt=""
                className="relative z-[1] h-40 w-auto max-w-full object-contain opacity-[0.94] drop-shadow-[0_12px_28px_rgba(15,39,68,0.12)] sm:h-44 md:h-48"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        </section>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-500">
            Bu kategoride henüz ürün yok.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
            {filtered.map((item) => (
              <li key={item._id}>
                <article
                  className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100/90 bg-white shadow-[0_10px_40px_-12px_rgba(15,39,68,0.12),0_4px_16px_-4px_rgba(0,0,0,0.06)] transition hover:shadow-[0_18px_48px_-14px_rgba(15,39,68,0.16),0_8px_20px_-6px_rgba(0,0,0,0.08)] ${
                    !item.inStock ? 'opacity-[0.85]' : ''
                  }`}
                >
                  <div className="relative aspect-square bg-gradient-to-b from-zinc-100 to-zinc-50">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt || item.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 50vw, 33vw"
                        placeholder={item.lqip ? 'blur' : 'empty'}
                        blurDataURL={item.lqip ?? undefined}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#1e3a5f]/25">
                        <Ship className="h-14 w-14" strokeWidth={1.25} aria-hidden />
                      </div>
                    )}
                    {!item.inStock && (
                      <span className="absolute right-2 top-2 rounded-full bg-zinc-900/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Tükendi
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col rounded-b-2xl px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4">
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#0f2744] sm:text-[17px]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                      {categoryLabel(item.category)}
                    </p>
                    {item.description ? (
                      <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-zinc-500">
                        {item.description}
                      </p>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <div className="mt-3 flex flex-col gap-2 sm:mt-4">
                      <p className="text-lg font-bold tabular-nums text-[#1e3a5f] sm:text-xl">
                        {formatTry(item.price)}
                      </p>
                      <span className="inline-flex w-fit max-w-full items-center gap-1 rounded-full border border-rose-200/60 bg-gradient-to-r from-rose-50/90 to-pink-50/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-900/80 shadow-sm">
                        <Wine className="h-3 w-3 shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
                        <span className="leading-none">Bar&apos;dan Teslim</span>
                      </span>
                    </div>
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

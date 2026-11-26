'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import FerryRouteCard, { type FerryRouteListItem } from '@/components/ferry/FerryRouteCard'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

const TEXTS: Record<SiteLocale, { title: string; subtitle: string; cta: string; listAria: string; prev: string; next: string }> = {
  tr: {
    title: 'Yunan Adaları Feribot',
    subtitle: 'Çeşme, Ayvalık, Aliağa ve Bodrum’dan Sakız, Midilli ve Kos’a feribot biletinizi kolayca alın.',
    cta: 'Tüm feribot hatları',
    listAria: 'Feribot hatları listesi',
    prev: 'Önceki hatlar',
    next: 'Sonraki hatlar',
  },
  en: {
    title: 'Greek Islands Ferries',
    subtitle: 'Book your ferry ticket from Çeşme, Ayvalık, Aliağa and Bodrum to Chios, Lesvos and Kos.',
    cta: 'All ferry routes',
    listAria: 'Ferry routes',
    prev: 'Previous routes',
    next: 'Next routes',
  },
  de: {
    title: 'Fähren zu den griechischen Inseln',
    subtitle: 'Fährtickets von Çeşme, Ayvalık, Aliağa und Bodrum nach Chios, Lesbos und Kos ganz einfach buchen.',
    cta: 'Alle Fährverbindungen',
    listAria: 'Fährverbindungen',
    prev: 'Vorherige Verbindungen',
    next: 'Nächste Verbindungen',
  },
  ru: {
    title: 'Паромы на греческие острова',
    subtitle: 'Билеты на паром из Чешме, Айвалыка, Алиаги и Бодрума на Хиос, Лесбос и Кос.',
    cta: 'Все паромные маршруты',
    listAria: 'Паромные маршруты',
    prev: 'Предыдущие маршруты',
    next: 'Следующие маршруты',
  },
}

/** Anasayfa: "Özel tekne kiralama" bölümünün altında feribot hattı kartları (PopularYachtsSection ile aynı kaydırmalı düzen). */
export default function HomeFerrySection({ routes, locale = 'tr' }: { routes: FerryRouteListItem[]; locale?: SiteLocale }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeDot, setActiveDot] = useState(0)
  const t = TEXTS[locale] ?? TEXTS.tr

  const scrollBy = (dx: number) => scrollRef.current?.scrollBy({ left: dx, behavior: 'smooth' })

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current
    const card = el?.children[index] as HTMLElement | undefined
    if (!el || !card) return
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const cards = Array.from(el.children) as HTMLElement[]
      let closest = 0
      let closestDist = Infinity
      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft - el.offsetLeft - el.scrollLeft)
        if (dist < closestDist) {
          closestDist = dist
          closest = i
        }
      })
      setActiveDot(closest)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [routes.length])

  if (routes.length === 0) return null

  return (
    /* Üst boşluk az: hemen üstündeki tekne bölümü zaten pb-16 ile bitiyor. */
    <section className="w-full bg-white pb-12 pt-2 md:pb-16 md:pt-4" aria-labelledby="home-ferry-heading">
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-10 text-center md:mb-12">
          <h2
            id="home-ferry-heading"
            className="mb-3 text-[28px] font-black uppercase leading-[1.15] sm:text-[32px] md:text-[36px] lg:text-[40px]"
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              fontWeight: 900,
              WebkitTextStroke: '0.6px currentColor',
              color: 'var(--primary, #2168b8)',
            }}
          >
            {t.title}
          </h2>
          <p className="mx-auto max-w-3xl text-sm font-normal leading-relaxed md:text-base" style={{ color: 'var(--text-color)' }}>
            {t.subtitle}
          </p>
        </header>

        <div className="relative">
          <div
            ref={scrollRef}
            role="region"
            aria-label={t.listAria}
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 pl-0 pr-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] md:pl-14 md:pr-14 [&::-webkit-scrollbar]:hidden"
          >
            {routes.map((route) => (
              <div key={route._id} className="w-[min(88vw,320px)] shrink-0 snap-start sm:w-[320px] md:w-[350px]">
                <FerryRouteCard route={route} locale={locale} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollBy(-336)}
            className="pointer-events-auto absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-md transition hover:bg-zinc-50 md:flex"
            style={{ color: 'var(--primary, #2168b8)' }}
            aria-label={t.prev}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(336)}
            className="pointer-events-auto absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-md transition hover:bg-zinc-50 md:flex"
            style={{ color: 'var(--primary, #2168b8)' }}
            aria-label={t.next}
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {routes.length > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2.5" role="tablist" aria-label={t.listAria}>
            {routes.map((route, i) => (
              <button
                key={route._id}
                type="button"
                role="tab"
                aria-selected={i === activeDot}
                aria-label={route.title ?? `${i + 1}`}
                onClick={() => scrollToIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ease-out ${
                  i === activeDot ? 'w-6 bg-[var(--primary,#2168b8)]' : 'w-2 bg-[#d4d4d8] hover:bg-[#a1a1aa]'
                }`}
              />
            ))}
          </div>
        )}

        <p className="mt-10 text-center md:mt-12">
          <Link
            href={withLocalePath(locale, '/feribot')}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 bg-white px-8 py-3 text-[14px] font-extrabold uppercase tracking-wide shadow-sm transition duration-200 hover:scale-105 hover:bg-[var(--primary)]/[0.06] sm:text-[15px]"
            style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
          >
            {t.cta}
          </Link>
        </p>
      </div>
    </section>
  )
}

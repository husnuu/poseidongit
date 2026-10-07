'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
// Sınıflar (TourClassShowcase) bölümüyle birebir aynı toggle/panel görünümü için
// aynı CSS modülü reuse ediliyor — iki bileşen de görsel olarak aynı dili konuşsun.
import showcaseStyles from '@/components/tour/TourClassShowcase.module.css'
import styles from './RouteSection.module.css'
import type { SiteLocale } from '@/lib/i18n/config'

export type RouteSectionLocation = {
  name: string
  location: string
  imageUrl: string | null
  alt: string | null
  /** /koylar'daki eşleşen koy dokümanının açıklaması — sadece gerçekten
   * yazılmışsa dolu gelir. */
  description?: string | null
}

export type RouteSectionProps = {
  heading: string
  description: string
  ctaButton?: { label?: string | null; href?: string | null } | null
  locations: RouteSectionLocation[]
  locale?: SiteLocale
}

const SELECT_ARIA: Record<string, string> = {
  tr: 'Koy seç',
  en: 'Select a cove',
  de: 'Bucht auswählen',
  ru: 'Выбрать бухту',
}

const NO_IMAGE_LABEL: Record<string, string> = {
  tr: 'Görsel yok',
  en: 'No image',
  de: 'Kein Bild',
  ru: 'Нет изображения',
}

export default function RouteSection({
  heading,
  description,
  ctaButton,
  locations,
  locale = 'tr',
}: RouteSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.08, rootMargin: '0px 0px 150px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const displayLocations = useMemo(() => locations.slice(0, 4), [locations])
  const hasAnyLocations = displayLocations.length > 0
  const titleText = heading.trim()
  const selectAria = SELECT_ARIA[locale] ?? SELECT_ARIA.tr
  const noImageLabel = NO_IMAGE_LABEL[locale] ?? NO_IMAGE_LABEL.tr

  const [activeIndex, setActiveIndex] = useState(0)
  const activeLoc = displayLocations[Math.min(activeIndex, displayLocations.length - 1)] ?? null

  return (
    <section
      ref={sectionRef}
      className="w-full overflow-hidden bg-[#eafbf7]"
      aria-labelledby="route-section-heading"
    >
      <div
        className={`mx-auto max-w-[1200px] px-4 pt-6 pb-14 transition-all duration-300 ease-out md:pt-8 md:pb-16 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <header className="mb-8 text-center md:mb-10">
          <h2
            id="route-section-heading"
            className="text-[28px] font-black uppercase leading-[1.15] sm:text-[32px] md:text-[36px] lg:text-[40px]"
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              fontWeight: 900,
              WebkitTextStroke: '0.4px currentColor',
              color: 'var(--primary, #2168b8)',
            }}
          >
            {titleText}
          </h2>
          {description && (
            <p
              className="mx-auto mt-4 max-w-[480px] text-base font-normal leading-relaxed md:text-lg"
              style={{ color: 'var(--text-color)' }}
            >
              {description}
            </p>
          )}
        </header>

        {hasAnyLocations && (
          <>
            <div
              role="tablist"
              aria-label={selectAria}
              className={showcaseStyles.tabs}
              style={{ margin: '0 auto' }}
            >
              {displayLocations.map((loc, index) => {
                const isActive = index === activeIndex
                return (
                  <button
                    key={`${loc.name}-${index}`}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    aria-controls={`route-location-panel-${index}`}
                    id={`route-location-tab-${index}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveIndex(index)}
                    className={`${showcaseStyles.tab} ${styles.tabOverride} ${isActive ? showcaseStyles.tabActive : ''}`}
                  >
                    <span className={showcaseStyles.tabLabel}>{loc.name}</span>
                  </button>
                )
              })}
            </div>

            {activeLoc && (
              <div
                id={`route-location-panel-${activeIndex}`}
                role="tabpanel"
                aria-labelledby={`route-location-tab-${activeIndex}`}
                className={showcaseStyles.panel}
              >
                <div className={showcaseStyles.gallery}>
                  {activeLoc.imageUrl ? (
                    <div className={showcaseStyles.imageWrap}>
                      <Image
                        src={activeLoc.imageUrl}
                        alt={activeLoc.alt || activeLoc.name}
                        fill
                        sizes="(max-width: 900px) 100vw, 55vw"
                        className={showcaseStyles.image}
                        priority={activeIndex === 0}
                      />
                    </div>
                  ) : (
                    <div className={showcaseStyles.imageEmpty}>{noImageLabel}</div>
                  )}
                </div>

                <div className={showcaseStyles.content}>
                  <div className={showcaseStyles.contentHeader}>
                    <h3 className={showcaseStyles.classLabel}>{activeLoc.name}</h3>
                  </div>
                  {activeLoc.location && (
                    // Tur sayfasındaki "Öne Çıkanlar" ikonlarıyla birebir aynı mavimsi-gri ton
                    // (bkz. HighlightsDetailsRow.module.css .iconBox).
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
                      style={{ color: '#8a99ad' }}
                    >
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                      {activeLoc.location}
                    </span>
                  )}
                  {activeLoc.description && (
                    <p className={showcaseStyles.description}>{activeLoc.description}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {ctaButton?.label && (
          <p className="mt-8 text-center md:mt-10">
            <Link
              href={ctaButton.href || '#'}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 px-8 py-3 text-sm font-bold uppercase tracking-wide shadow-sm transition duration-200 outline-none ring-offset-2 hover:scale-105 hover:bg-[var(--primary)]/[0.06] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              style={{
                fontFamily: 'var(--font-family)',
                borderColor: 'var(--primary, #2168b8)',
                color: 'var(--primary, #2168b8)',
                background: '#fff',
              }}
            >
              {ctaButton.label}
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}

'use client'

import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Plus, X } from 'lucide-react'
import modalStyles from './CoveModal.module.css'

export type RouteSectionLocation = {
  name: string
  location: string
  imageUrl: string | null
  alt: string | null
  /** /koylar'daki eşleşen koy dokümanının açıklaması — sadece gerçekten
   * yazılmışsa dolu gelir; doluysa kart tıklanabilir olup popup açar. */
  description?: string | null
}

export type RouteSectionProps = {
  heading: string
  description: string
  ctaButton?: { label?: string | null; href?: string | null } | null
  locations: RouteSectionLocation[]
  locale?: 'tr' | 'en' | 'de'
}

const CLOSE_LABEL: Record<string, string> = {
  tr: 'Kapat',
  en: 'Close',
  de: 'Schließen',
}

const DISCOVER_LABEL: Record<string, string> = {
  tr: 'Keşfet',
  en: 'Discover',
  de: 'Entdecken',
}

function LocationCard({
  loc,
  index,
  visible,
  aspectClass,
  sizes,
  onOpen,
  locale,
}: {
  loc: RouteSectionLocation
  index: number
  visible: boolean
  aspectClass: string
  sizes: string
  onOpen: () => void
  locale: string
}) {
  const hasDescription = Boolean(loc.description?.trim())
  const discoverLabel = DISCOVER_LABEL[locale] ?? DISCOVER_LABEL.tr
  const content = (
    <>
      {loc.imageUrl && (
        <>
          <Image
            src={loc.imageUrl}
            alt={loc.alt || loc.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes={sizes}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Tıklanabilirlik ipucu: etiket her zaman görünür (dokunmatikte hover
              olmadığı için şart) — cam efektli modern bir "chip" rozet;
              masaüstünde üstüne gelince hafifçe yükselir ve "+" ikonu döner. */}
          {hasDescription && (
            <span className="absolute right-3 top-3 z-[1] flex items-center gap-1.5 rounded-full bg-white/95 py-1.5 pl-1.5 pr-3 text-[var(--primary,#2168b8)] shadow-[0_2px_10px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_4px_18px_rgba(0,0,0,0.26)]">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary,#2168b8)] text-white transition-transform duration-300 group-hover:rotate-90">
                <Plus className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide">
                {discoverLabel}
              </span>
            </span>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/90">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {loc.location}
            </span>
            <div className="mt-0.5 font-bold text-white">{loc.name}</div>
          </div>
        </>
      )}
    </>
  )
  const sharedClassName = `group relative ${aspectClass} overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.04]`
  const sharedStyle = { transitionDelay: visible ? `${index * 100}ms` : '0ms' }

  if (hasDescription) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`${sharedClassName} cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2`}
        style={sharedStyle}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={sharedClassName} style={sharedStyle}>
      {content}
    </div>
  )
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
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

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

  useEffect(() => {
    const el = document.createElement('div')
    el.id = 'cove-modal-portal'
    document.body.appendChild(el)
    setPortalEl(el)
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
  }, [])

  useEffect(() => {
    if (openIndex === null) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [openIndex])

  const displayLocations = locations.slice(0, 4)
  const hasAnyLocations = displayLocations.length > 0
  const titleText = heading.trim()
  const openLoc = openIndex !== null ? displayLocations[openIndex] : null

  const modal =
    portalEl && openLoc
      ? createPortal(
          <div
            className={`${modalStyles.overlay} ${modalStyles.overlayVisible}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpenIndex(null)
            }}
            role="dialog"
            aria-modal
            aria-label={openLoc.name}
          >
            <div className={modalStyles.sheet}>
              <div className={modalStyles.media}>
                <div className={modalStyles.sheetHandle} aria-hidden />
                {openLoc.imageUrl && (
                  <Image
                    src={openLoc.imageUrl}
                    alt={openLoc.alt || openLoc.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 520px"
                  />
                )}
                <div className={modalStyles.mediaGradient} aria-hidden />
                <button
                  type="button"
                  className={modalStyles.closeBtn}
                  onClick={() => setOpenIndex(null)}
                  aria-label={CLOSE_LABEL[locale] ?? CLOSE_LABEL.tr}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
                {/* Kartla aynı yerleşim: konum + başlık fotoğrafın üstünde */}
                <div className={modalStyles.mediaContent}>
                  <p className={modalStyles.overlayLocationTag}>
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {openLoc.location}
                  </p>
                  <h3 className={modalStyles.overlayTitle}>{openLoc.name}</h3>
                </div>
              </div>
              {openLoc.description && (
                <div className={modalStyles.body}>
                  <p className={modalStyles.description}>{openLoc.description}</p>
                </div>
              )}
            </div>
          </div>,
          portalEl
        )
      : null

  return (
    <section
      ref={sectionRef}
      className="w-full overflow-hidden"
      aria-labelledby="route-section-heading"
    >
      <div
        className={`mx-auto max-w-7xl px-6 pt-6 pb-14 transition-all duration-300 ease-out md:pt-8 md:pb-16 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          {/* Başlık (+ varsa açıklama) — artık fotoğrafların üstünde, tam genişlikte ortalanmış */}
          <div className="mb-10 md:mb-14">
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
          </div>

          {/* Foto grid — mobilde 2x2, masaüstünde standart (dikey olmayan) 4'lü kart satırı */}
          {hasAnyLocations && (
            <div className="w-full">
              {/* Mobil: 2 sütun grid */}
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {displayLocations.map((loc, index) => (
                  <LocationCard
                    key={index}
                    loc={loc}
                    index={index}
                    visible={visible}
                    aspectClass="aspect-[3/4]"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    onOpen={() => setOpenIndex(index)}
                    locale={locale}
                  />
                ))}
              </div>

              {/* Masaüstü: standart, yatay oranlı 4'lü kart satırı (dikey kolaj değil) */}
              <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                {displayLocations.map((loc, index) => (
                  <LocationCard
                    key={index}
                    loc={loc}
                    index={index}
                    visible={visible}
                    aspectClass="aspect-[4/3]"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    onOpen={() => setOpenIndex(index)}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

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

      {modal}
    </section>
  )
}

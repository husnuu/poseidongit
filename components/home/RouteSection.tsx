'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'

export type RouteSectionLocation = {
  name: string
  location: string
  imageUrl: string | null
  alt: string | null
}

export type RouteSectionProps = {
  heading: string
  description: string
  ctaButton?: { label?: string | null; href?: string | null } | null
  locations: RouteSectionLocation[]
}

export default function RouteSection({
  heading,
  description,
  ctaButton,
  locations,
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
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const displayLocations = locations.slice(0, 4)
  const hasAnyLocations = displayLocations.length > 0
  const words = heading.trim().split(/\s+/)
  const firstTwo = words.slice(0, 2).join(' ')
  const rest = words.slice(2).join(' ')

  return (
    <section
      ref={sectionRef}
      className="w-full overflow-hidden"
      aria-labelledby="route-section-heading"
    >
      <div
        className={`mx-auto max-w-7xl px-6 pt-6 pb-14 transition-all duration-700 ease-out md:pt-8 md:pb-16 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Sol: Başlık, Açıklama, CTA */}
          <div className="flex flex-col">
            <h2
              id="route-section-heading"
              className="text-[34px] font-black uppercase leading-[1.15] sm:text-[38px] md:text-[42px] lg:text-[46px]"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
            >
              {firstTwo && <span style={{ color: '#1e3a8a' }}>{firstTwo}</span>}
              {(firstTwo && rest) ? ' ' : ''}
              {rest && <span style={{ color: '#000' }}>{rest}</span>}
            </h2>
            {description && (
              <p
                className="mt-4 max-w-[480px] text-base leading-[1.7] md:text-lg"
                style={{ color: 'var(--text-color)' }}
              >
                {description}
              </p>
            )}
            {ctaButton?.label && (
              <p className="mt-8 md:mt-10">
                <Link
                  href={ctaButton.href || '#'}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-[#1e3a5f] bg-white px-8 py-3 text-sm font-black uppercase tracking-wide text-[#1e3a5f] shadow-sm transition hover:bg-[#1e3a5f]/[0.06] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
                  style={{ fontFamily: 'var(--font-family)' }}
                >
                  {ctaButton.label}
                </Link>
              </p>
            )}
          </div>

          {/* Sağ: Foto grid - dikey kartlar tam yükseklik (row-span-2) */}
          {hasAnyLocations && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:grid-rows-[1fr_1fr]">
              {/* Mobil: 2 sütun grid */}
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {displayLocations.map((loc, index) => (
                  <div
                    key={index}
                    className="relative aspect-[3/4] overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.04]"
                    style={{
                      transitionDelay: visible ? `${index * 100}ms` : '0ms',
                    }}
                  >
                    {loc.imageUrl && (
                      <>
                        <Image
                          src={loc.imageUrl}
                          alt={loc.alt || loc.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/90">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {loc.location}
                          </span>
                          <div className="mt-0.5 font-bold text-white">
                            {loc.name}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: 1 dikey | 2 kare | 1 dikey */}
              <>
                {displayLocations[0] && (
                  <div
                    className="relative hidden h-full min-h-0 overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.04] sm:col-start-1 sm:row-span-2 sm:row-start-1 sm:block"
                    style={{
                      transitionDelay: visible ? '0ms' : '0ms',
                    }}
                  >
                    {displayLocations[0].imageUrl && (
                      <>
                        <Image
                          src={displayLocations[0].imageUrl}
                          alt={displayLocations[0].alt || displayLocations[0].name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/90">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {displayLocations[0].location}
                          </span>
                          <div className="mt-0.5 font-bold text-white">
                            {displayLocations[0].name}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {displayLocations[1] && (
                  <div
                    className="relative hidden aspect-square overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.04] sm:col-start-2 sm:row-start-1 sm:block"
                    style={{
                      transitionDelay: visible ? '100ms' : '0ms',
                    }}
                  >
                    {displayLocations[1].imageUrl && (
                      <>
                        <Image
                          src={displayLocations[1].imageUrl}
                          alt={displayLocations[1].alt || displayLocations[1].name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/90">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {displayLocations[1].location}
                          </span>
                          <div className="mt-0.5 font-bold text-white">
                            {displayLocations[1].name}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {displayLocations[2] && (
                  <div
                    className="relative hidden aspect-square overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.04] sm:col-start-2 sm:row-start-2 sm:block sm:aspect-square"
                    style={{
                      transitionDelay: visible ? '200ms' : '0ms',
                    }}
                  >
                    {displayLocations[2].imageUrl && (
                      <>
                        <Image
                          src={displayLocations[2].imageUrl}
                          alt={displayLocations[2].alt || displayLocations[2].name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/90">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {displayLocations[2].location}
                          </span>
                          <div className="mt-0.5 font-bold text-white">
                            {displayLocations[2].name}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {displayLocations[3] && (
                  <div
                    className="relative hidden h-full min-h-0 overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.04] sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:block"
                    style={{
                      transitionDelay: visible ? '300ms' : '0ms',
                    }}
                  >
                    {displayLocations[3].imageUrl && (
                      <>
                        <Image
                          src={displayLocations[3].imageUrl}
                          alt={displayLocations[3].alt || displayLocations[3].name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/90">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {displayLocations[3].location}
                          </span>
                          <div className="mt-0.5 font-bold text-white">
                            {displayLocations[3].name}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

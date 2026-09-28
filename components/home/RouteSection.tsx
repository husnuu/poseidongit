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
      { threshold: 0.08, rootMargin: '0px 0px 150px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const displayLocations = locations.slice(0, 4)
  const hasAnyLocations = displayLocations.length > 0
  const titleText = heading.trim()

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
              className="text-[24px] font-black uppercase leading-[1.15] sm:text-[27px] md:text-[30px] lg:text-[33px]"
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

              {/* Masaüstü: standart, yatay oranlı 4'lü kart satırı (dikey kolaj değil) */}
              <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                {displayLocations.map((loc, index) => (
                  <div
                    key={index}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.03]"
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
                          sizes="(max-width: 1024px) 50vw, 25vw"
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
    </section>
  )
}

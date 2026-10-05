'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  /** Görünür olduğunda animasyonun başlamasını geciktirir (ms) — kademeli (stagger) efekt için. */
  delayMs?: number
}

/** Anasayfa bölümlerinin, kaydırırken ekrana girdiğinde yumuşakça belirmesi için
    ince bir sarmalayıcı (IntersectionObserver tabanlı) — bkz. .scroll-reveal (globals.css). */
export default function ScrollReveal({ children, className = '', delayMs = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      // Sitedeki diğer bölümlerin (RouteSection, HomeReviewsSection, vb.) kendi
      // IntersectionObserver'larıyla aynı, cömert eşik — önceki negatif rootMargin
      // (-60px) hero'nun hemen altındaki içeriğin sayfa ilk açıldığında (henüz
      // kaydırmadan) görünür kalmasını engelliyor, mobilde beyaz bir boşluk gibi
      // görünüyordu.
      { threshold: 0.08, rootMargin: '0px 0px 150px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? 'scroll-reveal-visible' : ''} ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  )
}

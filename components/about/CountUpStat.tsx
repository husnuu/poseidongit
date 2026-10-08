'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpStatProps {
  /** Hedef sayısal değer (ör. 38, 7, 4.7). */
  value: number
  /** Gösterilecek ondalık basamak sayısı — "4,7" için 1, "38" için 0. */
  decimals?: number
  /** Sayıdan sonra eklenecek sabit metin (ör. "+"). */
  suffix?: string
  /** toLocaleString için — ondalık ayıracı (nokta/virgül) dile göre doğru olsun diye. */
  numberLocale?: string
  className?: string
  style?: React.CSSProperties
}

/** Ekrana girince 0'dan hedef değere doğru kısa bir sayma animasyonu —
    güven rozetlerindeki rakamların "canlı" hissetmesi için. Azaltılmış
    hareket tercih edilmişse animasyon atlanır, direkt son değer gösterilir. */
export default function CountUpStat({
  value,
  decimals = 0,
  suffix = '',
  numberLocale = 'tr-TR',
  className,
  style,
}: CountUpStatProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      setDone(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const duration = 1100
        const start = performance.now()
        const tick = (now: number) => {
          const elapsed = now - start
          const progress = Math.min(1, elapsed / duration)
          // easeOutCubic — hızlı başlayıp yumuşakça yavaşlar
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(value * eased)
          if (progress < 1) {
            requestAnimationFrame(tick)
          } else {
            setDisplay(value)
            setDone(true)
          }
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  const formatted = (done ? value : display).toLocaleString(numberLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className} style={style}>
      {formatted}
      {suffix}
    </span>
  )
}

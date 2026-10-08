'use client'

import { useEffect, useRef, useState } from 'react'

interface GrowLineProps {
  className?: string
  style?: React.CSSProperties
}

/** Zaman tüneli çizgisi: sabit süreli bir animasyon değil, doğrudan kaydırma
    miktarına bağlı (scrub) bir ilerleme — kullanıcı aşağı kaydırdıkça çizgi
    yukarıdan aşağıya "çizilerek" uzuyor, yukarı kaydırırsa kısalıyor. Kısa
    mobil segmentlerde de uzun masaüstü çizgisinde de aynı mantık çalışıyor
    çünkü ilerleme elemanın KENDİ yüksekliğine göre normalize ediliyor.
    Azaltılmış hareket tercih edilmişse animasyon atlanır, çizgi direkt tam
    boyda görünür. */
export default function GrowLine({ className, style }: GrowLineProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1)
      return
    }

    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      // transform-origin "top" olduğu için üst kenar her zaman doğru yerde
      // kalıyor — ölçeklenmeyen gerçek yükseklik için rect.height değil
      // offsetHeight kullanıyoruz (transform'dan etkilenmiyor).
      const fullHeight = el.offsetHeight || 1
      const vh = window.innerHeight || 1
      // Eleman ekranın altından girmeye başladığında 0, tamamen ekranın
      // üstünden çıktığında 1 — kullanıcının elemanı kaydırarak geçtiği
      // tüm süreye yayılan bir ilerleme.
      const raw = (vh - rect.top) / (fullHeight + vh)
      setProgress(Math.min(1, Math.max(0, raw)))
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <span
      ref={ref}
      aria-hidden
      className={className}
      style={{
        ...style,
        transformOrigin: 'top',
        transform: `scaleY(${progress})`,
        willChange: 'transform',
      }}
    />
  )
}

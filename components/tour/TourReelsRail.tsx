'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './TourReelsRail.module.css'

export type TourReelSlide = {
  videoUrl: string
  posterUrl?: string
}

type TourReelsRailProps = {
  slides: TourReelSlide[]
  locale: SiteLocale
}

export default function TourReelsRail({ slides, locale }: TourReelsRailProps) {
  const tourUi = useMemo(() => getTourPageUi(locale), [locale])
  const sectionRef = useRef<HTMLElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const scrollRaf = useRef<number | null>(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const [soundIndex, setSoundIndex] = useState<number | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [railVisible, setRailVisible] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduceMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => setRailVisible(Boolean(e?.isIntersecting)),
      { root: null, threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const updateActiveFromScroll = useCallback(() => {
    const sc = scrollerRef.current
    if (!sc) return
    const mid = sc.scrollLeft + sc.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < slides.length; i++) {
      const el = itemRefs.current[i]
      if (!el) continue
      const center = el.offsetLeft + el.offsetWidth / 2
      const d = Math.abs(center - mid)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    setActiveIndex((prev) => (prev !== best ? best : prev))
  }, [slides.length])

  const onScrollerScroll = useCallback(() => {
    if (scrollRaf.current != null) cancelAnimationFrame(scrollRaf.current)
    scrollRaf.current = requestAnimationFrame(() => {
      scrollRaf.current = null
      updateActiveFromScroll()
    })
  }, [updateActiveFromScroll])

  useEffect(() => {
    updateActiveFromScroll()
  }, [updateActiveFromScroll])

  useEffect(() => {
    const sc = scrollerRef.current
    if (!sc || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => updateActiveFromScroll())
    ro.observe(sc)
    return () => ro.disconnect()
  }, [updateActiveFromScroll])

  useEffect(() => {
    if (reduceMotion) setSoundIndex(null)
  }, [reduceMotion])

  useEffect(() => {
    const videos = videoRefs.current
    for (let i = 0; i < slides.length; i++) {
      const v = videos[i]
      if (!v) continue
      const isActive = i === activeIndex
      const soundOn = soundIndex === i && isActive
      v.muted = !soundOn
      if (isActive && !reduceMotion && railVisible) {
        v.play().catch(() => {})
      } else {
        v.pause()
      }
    }
  }, [activeIndex, soundIndex, reduceMotion, railVisible, slides.length])

  const scrollItemToStart = useCallback((i: number) => {
    const sc = scrollerRef.current
    const el = itemRefs.current[i]
    if (!sc || !el) return
    const pad = parseFloat(getComputedStyle(sc).paddingLeft) || 0
    const target = el.offsetLeft - pad
    sc.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [])

  const handleSoundClick = (i: number) => {
    if (reduceMotion) return
    if (activeIndex !== i) {
      scrollItemToStart(i)
    }
    setSoundIndex((prev) => (prev === i ? null : i))
  }

  if (slides.length === 0) return null

  const total = slides.length

  return (
    <section ref={sectionRef} className={styles.section} aria-label={tourUi.reelsAriaLabel}>
      <div className={styles.scrollerBleed}>
        <div
          ref={scrollerRef}
          onScroll={onScrollerScroll}
          className={styles.scroller}
          role="list"
        >
        {slides.map((slide, i) => {
          const soundOn = soundIndex === i && activeIndex === i
          return (
            <div
              key={`${slide.videoUrl}-${i}`}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className="w-[min(72vw,260px)] shrink-0 snap-start"
              role="listitem"
            >
              <div className="overflow-hidden rounded-2xl bg-zinc-900 shadow-lg ring-1 ring-black/10">
                <div className="relative aspect-[9/16]">
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el
                    }}
                    src={slide.videoUrl}
                    poster={slide.posterUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    loop
                    playsInline
                    muted
                    preload={i === activeIndex ? 'auto' : 'metadata'}
                    aria-label={tourUi.reelsVideoAria(i + 1, total)}
                  />

                  <button
                    type="button"
                    className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 disabled:opacity-40"
                    onClick={() => handleSoundClick(i)}
                    disabled={reduceMotion}
                    aria-label={soundOn ? tourUi.reelsUnmuteAria : tourUi.reelsMuteAria}
                    aria-pressed={soundOn}
                  >
                    {soundOn ? (
                      <Volume2 className="h-5 w-5" aria-hidden />
                    ) : (
                      <VolumeX className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </section>
  )
}

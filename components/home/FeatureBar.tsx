'use client'

import { useRef, useEffect, useState } from 'react'
import {
  Bolt,
  Star,
  Shield,
  ThumbsUp,
  Anchor,
  Clock,
  MapPin,
  Phone,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  bolt: Bolt,
  star: Star,
  shield: Shield,
  thumbsUp: ThumbsUp,
  anchor: Anchor,
  clock: Clock,
  mapPin: MapPin,
  phone: Phone,
}

export type FeatureBarItem = {
  icon: string
  title: string
  description?: string | null
}

type FeatureBarProps = {
  items: FeatureBarItem[]
}

const ICON_SIZE = 32

export default function FeatureBar({ items }: FeatureBarProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const displayItems = items.slice(0, 4)
  if (displayItems.length === 0) return null

  return (
    <section
      ref={sectionRef}
      className="w-full text-white transition-all duration-700 ease-out py-10 md:py-12"
      style={{
        background: 'linear-gradient(to right, #1e3a5f 0%, #1e4976 35%, #2563eb 70%, #38bdf8 100%)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
      aria-label="Özellikler"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid gap-8 md:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {displayItems.map((item, index) => {
            const IconComponent = iconMap[item.icon] ?? Bolt
            return (
              <div
                key={index}
                className="flex items-center gap-4"
              >
                <div
                  className="flex-shrink-0 transition-transform duration-200 hover:scale-110"
                  aria-hidden
                >
                  <IconComponent
                    size={ICON_SIZE}
                    strokeWidth={2}
                    className="stroke-white"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-bold uppercase text-base md:text-lg leading-tight tracking-wide">
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="text-sm md:text-base font-medium mt-0.5 opacity-90">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

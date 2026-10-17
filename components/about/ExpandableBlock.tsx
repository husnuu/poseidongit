'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ExpandableBlockProps {
  children: ReactNode
  /** Kapalı haldeyken uygulanacak satır kısıtlaması — Tailwind'in native
      line-clamp sınıfı, derlenebilmesi için sabit/literal olmalı. */
  clampClassName?: string
  moreLabel: string
  lessLabel: string
}

/** Sanity'den gelen uzun metin bloklarını (PortableText) varsayılan olarak
    birkaç satırla sınırlar, taşma varsa "Devamını oku" ile tamamını açar —
    metnin tamamı her zaman DOM'da kalır (kısaltma/uydurma yok), sadece
    görünürlüğü kısıtlanır. İçerik zaten kısaysa (taşma yoksa) buton hiç
    gösterilmez. */
export default function ExpandableBlock({ children, clampClassName = 'line-clamp-5', moreLabel, lessLabel }: ExpandableBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setOverflowing(el.scrollHeight - el.clientHeight > 2)
  }, [])

  return (
    <div>
      <div ref={ref} className={expanded ? '' : clampClassName}>
        {children}
      </div>
      {overflowing && (
        /* Tur açıklamasındaki "daha fazla" bağlantısıyla aynı dil: kalın mavi
           metin + ince "˅", altı çizgisiz. */
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="mt-4 inline-flex items-center gap-2 text-[17px] font-bold transition-colors duration-150 hover:opacity-80"
          style={{ color: 'var(--primary, #2168b8)' }}
        >
          {expanded ? lessLabel : moreLabel}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M6 9.5l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

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
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-[15px] font-bold underline decoration-2 underline-offset-4"
          style={{ color: 'var(--primary, #2168b8)' }}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  )
}

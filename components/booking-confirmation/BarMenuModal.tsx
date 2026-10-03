'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import MenuPageClient, { type MenuItemCard } from '@/components/menu/MenuPageClient'
import type { SiteLocale } from '@/lib/i18n/config'

interface BarMenuModalProps {
  locale: SiteLocale
  onClose: () => void
  closeAria?: string
  loadingLabel?: string
}

/** Rezervasyon onay sayfasındaki "Bar menüsünü gör" tıklanınca ayrı bir sayfaya
    gitmek yerine açılan popup — /menu sayfasıyla aynı MenuPageClient içeriğini
    bir modal içinde gösterir, veriyi /api/menu-items'tan kendi çeker. */
export default function BarMenuModal({ locale, onClose, closeAria = 'Kapat', loadingLabel = 'Yükleniyor…' }: BarMenuModalProps) {
  const [items, setItems] = useState<MenuItemCard[] | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/menu-items?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : [])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bar-menu-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 id="bar-menu-modal-title" className="sr-only">
            Tekne Barı Menüsü
          </h2>
          <span aria-hidden />
          <button
            type="button"
            onClick={onClose}
            aria-label={closeAria}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {items === null ? (
            <div className="py-16 text-center text-sm text-zinc-500">{loadingLabel}</div>
          ) : (
            <MenuPageClient items={items} locale={locale} />
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'
import flags from 'react-phone-number-input/flags'
import { getNationalityOptions } from './nationalityOptions'
import type { SiteLocale } from '@/lib/i18n/config'
import styles from './NationalitySelect.module.css'

interface NationalitySelectProps {
  value: string
  onChange: (code: string) => void
  locale: SiteLocale
  id?: string
}

const SEARCH_PLACEHOLDER: Record<SiteLocale, string> = {
  tr: 'Ülke ara…',
  en: 'Search country…',
  de: 'Land suchen…',
}

const NO_RESULTS: Record<SiteLocale, string> = {
  tr: 'Sonuç bulunamadı',
  en: 'No results found',
  de: 'Keine Ergebnisse',
}

interface PanelRect {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

/** Telefon alanımızdaki (react-phone-number-input) gerçek bayrak ikonlarını kullanan,
    aranabilir uyruk seçici — native <select> yerine PhoneField ile aynı görsel dil.
    Liste, modal içindeki kaydırılabilir alanın (overflow) kırpmaması için
    document.body'e portal ile, viewport'a göre sabit konumlandırılarak açılır. */
export default function NationalitySelect({ value, onChange, locale, id }: NationalitySelectProps) {
  const options = useMemo(() => getNationalityOptions(locale), [locale])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [rect, setRect] = useState<PanelRect | null>(null)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => setMounted(true), [])

  const PREFERRED_HEIGHT = 320
  const MIN_HEIGHT = 160

  const updateRect = () => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const viewportH = window.innerHeight
    const spaceBelow = viewportH - r.bottom - 12
    const spaceAbove = r.top - 12
    if (spaceBelow >= MIN_HEIGHT || spaceBelow >= spaceAbove) {
      setRect({ top: r.bottom + 6, left: r.left, width: r.width, maxHeight: Math.max(MIN_HEIGHT, Math.min(PREFERRED_HEIGHT, spaceBelow)) })
    } else {
      setRect({ bottom: viewportH - r.top + 6, left: r.left, width: r.width, maxHeight: Math.max(MIN_HEIGHT, Math.min(PREFERRED_HEIGHT, spaceAbove)) })
    }
  }

  useLayoutEffect(() => {
    if (open) updateRect()
  }, [open])

  useEffect(() => {
    if (!open) return

    const isInside = (target: EventTarget | null) =>
      (containerRef.current && containerRef.current.contains(target as Node)) ||
      (panelRef.current && panelRef.current.contains(target as Node))

    const onClickOutside = (e: MouseEvent) => {
      if (!isInside(e.target)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    // Panel/liste içindeki kaydırma hariç, dışarıdaki her scroll'da kapat
    // (böylece hem modal hem sayfa scroll'unda konum bozulmaz).
    const onScroll = (e: Event) => {
      if (!isInside(e.target)) setOpen(false)
    }
    const onResize = () => updateRect()

    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      const raf = requestAnimationFrame(() => searchRef.current?.focus())
      return () => cancelAnimationFrame(raf)
    }
  }, [open])

  const selected = options.find((o) => o.code === value) ?? options[0]
  const SelectedFlag = selected ? flags[selected.code as keyof typeof flags] : undefined

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale)
    if (!q) return options
    return options.filter((o) => o.label.toLocaleLowerCase(locale).includes(q))
  }, [options, query, locale])

  const panel =
    open && rect ? (
      <div
        ref={panelRef}
        className={styles.panel}
        style={{
          position: 'fixed',
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          maxHeight: rect.maxHeight,
        }}
      >
        <div className={styles.searchRow}>
          <Search size={15} className={styles.searchIcon} aria-hidden />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={SEARCH_PLACEHOLDER[locale] ?? SEARCH_PLACEHOLDER.tr}
            className={styles.searchInput}
          />
        </div>
        <ul role="listbox" className={styles.list}>
          {filtered.length === 0 && <li className={styles.empty}>{NO_RESULTS[locale] ?? NO_RESULTS.tr}</li>}
          {filtered.map((opt) => {
            const Flag = flags[opt.code as keyof typeof flags]
            const isSelected = opt.code === value
            return (
              <li key={opt.code} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={`${styles.option} ${isSelected ? styles.optionActive : ''}`}
                  onClick={() => {
                    onChange(opt.code)
                    setOpen(false)
                  }}
                >
                  <span className={styles.flag}>{Flag && <Flag title={opt.label} />}</span>
                  <span className={styles.optionLabel}>{opt.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    ) : null

  return (
    <div ref={containerRef} className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.flag}>{SelectedFlag && <SelectedFlag title={selected!.label} />}</span>
        <span className={styles.label}>{selected?.label}</span>
        <ChevronDown size={16} className={styles.chevron} style={open ? { transform: 'rotate(180deg)' } : undefined} aria-hidden />
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  )
}

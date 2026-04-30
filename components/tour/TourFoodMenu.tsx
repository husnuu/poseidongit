'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock, PortableTextComponents } from '@portabletext/react'
import { X } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './TourFoodMenu.module.css'

export type TourFoodMenuItem = {
  title: string
  excerpt?: string | null
  priceLabel?: string | null
  metaLine1?: string | null
  metaLine2?: string | null
  imageUrl?: string | null
  imageAlt?: string | null
  detail?: PortableTextBlock[] | null
}

export type TourFoodMenuProps = {
  sectionTitle: string
  intro?: string | null
  items: TourFoodMenuItem[]
  locale?: SiteLocale
}

function splitMenuLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const foodMenuDetailComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <div className={styles.menuDishRow}>
        <div className={styles.menuDishRowText}>{children}</div>
      </div>
    ),
    h2: ({ children }) => <h4 className={styles.menuBlockHeading}>{children}</h4>,
    h3: ({ children }) => <h4 className={styles.menuBlockHeading}>{children}</h4>,
    h4: ({ children }) => <h4 className={styles.menuBlockHeading}>{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote className={styles.menuBlockquote}>{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className={styles.menuDishListNested}>{children}</ul>,
    number: ({ children }) => <ol className={styles.menuDishListNested}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className={styles.menuDishNestedItem}>{children}</li>,
    number: ({ children }) => <li className={styles.menuDishNestedItem}>{children}</li>,
  },
}

function ExcerptMenuList({ text, ariaLabel }: { text: string; ariaLabel: string }) {
  const lines = splitMenuLines(text)
  if (!lines.length) return null
  return (
    <ul className={styles.menuDishList} aria-label={ariaLabel}>
      {lines.map((line, i) => (
        <li key={i} className={styles.menuDishRow}>
          <div className={styles.menuDishRowText}>{line}</div>
        </li>
      ))}
    </ul>
  )
}

export default function TourFoodMenu({ sectionTitle, intro, items, locale }: TourFoodMenuProps) {
  const tourUi = useMemo(() => getTourPageUi(locale ?? 'tr'), [locale])
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const close = useCallback(() => setOpenIndex(null), [])

  useEffect(() => {
    if (openIndex === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [openIndex, close])

  if (!items.length) return null

  const active = openIndex !== null ? items[openIndex] : null
  const hasDetail = active?.detail && active.detail.length > 0
  const hasAnyModalContent = (item: TourFoodMenuItem) =>
    Boolean(
      item.imageUrl ||
        (item.detail && item.detail.length > 0) ||
        item.excerpt?.trim() ||
        item.priceLabel?.trim() ||
        item.metaLine1?.trim() ||
        item.metaLine2?.trim()
    )

  return (
    <section className={styles.section} aria-labelledby="tour-food-menu-heading">
      <h2 id="tour-food-menu-heading" className={styles.heading}>
        {sectionTitle}
      </h2>
      {intro?.trim() ? (
        <p className={styles.intro}>{intro.trim()}</p>
      ) : null}
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`} className={styles.row}>
            <div className={styles.thumb}>
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className={styles.thumbImg}
                  sizes="160px"
                  aria-hidden
                />
              ) : (
                <span className={styles.thumbPlaceholder} aria-hidden>
                  ···
                </span>
              )}
            </div>
            <div className={styles.rowMain}>
              <h3 className={styles.rowTitle}>{item.title}</h3>
              {hasAnyModalContent(item) ? (
                <button
                  type="button"
                  className={styles.detailLink}
                  onClick={() => setOpenIndex(index)}
                >
                  {tourUi.foodMenuDetailBtn}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {mounted && active
        ? createPortal(
            <div
              className={styles.overlay}
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget) close()
              }}
            >
              <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-food-menu-dialog-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.dialogHeader}>
                  <h3 id="tour-food-menu-dialog-title" className={styles.dialogTitle}>
                    {active.title}
                  </h3>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={close}
                    aria-label={tourUi.foodMenuCloseAria}
                  >
                    <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </button>
                </div>
                <div className={styles.dialogBody}>
                  {active.imageUrl ? (
                    <div className={styles.dialogImageWrap}>
                      <Image
                        src={active.imageUrl}
                        alt={active.imageAlt || active.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 448px"
                      />
                    </div>
                  ) : null}
                  {active.priceLabel?.trim() ? (
                    <p className={styles.dialogPrice}>{active.priceLabel.trim()}</p>
                  ) : null}
                  {active.metaLine1?.trim() ? (
                    <p className={styles.dialogMeta}>{active.metaLine1.trim()}</p>
                  ) : null}
                  {active.metaLine2?.trim() ? (
                    <p className={styles.dialogMeta}>{active.metaLine2.trim()}</p>
                  ) : null}
                  {active.excerpt?.trim() ? (
                    <ExcerptMenuList text={active.excerpt.trim()} ariaLabel={tourUi.foodMenuExcerptAria} />
                  ) : null}
                  {hasDetail ? (
                    <div className={styles.menuDetailStack}>
                      <PortableText value={active.detail!} components={foodMenuDetailComponents} />
                    </div>
                  ) : null}
                  {!hasDetail &&
                  !active.excerpt?.trim() &&
                  !active.priceLabel?.trim() &&
                  !active.metaLine1?.trim() &&
                  !active.metaLine2?.trim() &&
                  !active.imageUrl ? (
                    <p className="m-0 text-zinc-500 text-sm">{tourUi.foodMenuEmptyDetail}</p>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  )
}

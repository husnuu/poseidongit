'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  Anchor,
  BedDouble,
  Calendar,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Ruler,
  Users,
  X,
} from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import type { TourBoat } from '@/lib/sanity/getTourFull'
import styles from './TourBoatSection.module.css'

/**
 * Tur sayfasındaki "Tekneniz" satırı ve detay penceresi. Tüm içerik Sanity'deki
 * `boat` dokümanından gelir (tur üzerinden referansla) — burada sabit metin ya
 * da örnek veri yok. Alan boşsa ilgili satır/bölüm hiç render edilmez.
 */
export default function TourBoatSection({
  boat,
  locale = 'tr',
}: {
  boat?: TourBoat | null
  locale?: SiteLocale
}) {
  const ui = useMemo(() => getTourPageUi(locale), [locale])
  const [open, setOpen] = useState(false)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)
  const [galleryExpanded, setGalleryExpanded] = useState(false)
  /* Mobilde mozaik yerine tek tek kaydırılan şerit; aktif nokta için konum. */
  const galleryRef = useRef<HTMLDivElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)

  const onGalleryScroll = () => {
    const el = galleryRef.current
    if (!el || galleryExpanded) return
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
    setActiveSlide(i)
  }

  useEffect(() => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    setPortalEl(el)
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const name = boat?.name?.trim()
  const cover = boat?.coverImage?.url?.trim() || null
  if (!boat || !name) return null

  const gallery = (boat.gallery ?? []).filter((g) => g?.url?.trim())
  const amenities = (boat.amenities ?? []).map((a) => a?.trim()).filter(Boolean) as string[]
  const s = boat.specs ?? {}

  const nf = (v: number) => v.toLocaleString(ui.numberLocale)

  /* Satırdaki küçük meta: yalnızca Sanity'de dolu olanlar. */
  const metaItems: { Icon: typeof Users; text: string }[] = []
  if (s.capacity != null) metaItems.push({ Icon: Users, text: ui.boatGuestsSuffix(nf(s.capacity)) })
  if (s.buildYear != null)
    metaItems.push({ Icon: Calendar, text: ui.boatBuildYearShort(String(s.buildYear)) })

  const specRows: { Icon: typeof Users; label: string; value: string }[] = []
  if (s.buildYear != null) specRows.push({ Icon: Calendar, label: ui.boatSpecBuildYear, value: String(s.buildYear) })
  if (s.capacity != null) specRows.push({ Icon: Users, label: ui.boatSpecCapacity, value: nf(s.capacity) })
  if (s.cabins != null) specRows.push({ Icon: BedDouble, label: ui.boatSpecCabins, value: nf(s.cabins) })
  if (s.wc != null) specRows.push({ Icon: Anchor, label: ui.boatSpecWc, value: nf(s.wc) })
  if (s.length?.trim()) specRows.push({ Icon: Ruler, label: ui.boatSpecLength, value: s.length.trim() })
  if (s.crew != null) specRows.push({ Icon: Users, label: ui.boatSpecCrew, value: nf(s.crew) })

  /* Mozaik: ilk görsel büyük, sonraki 4'ü sağda 2x2. Kalanlar "tümünü gör" ile. */
  const mosaic = gallery.slice(0, 5)
  const restCount = Math.max(0, gallery.length - mosaic.length)

  const modal =
    portalEl && open
      ? createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal
            aria-label={name}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <div className={styles.sheet}>
              {/* Mobilde alttan açılan panelin tutamacı; masaüstünde gizli. */}
              <span className={styles.handle} aria-hidden />
              <div className={styles.sheetHeader}>
                <p className={styles.sheetTitle}>{name}</p>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setOpen(false)}
                  aria-label={ui.boatCloseAria}
                >
                  <X size={20} strokeWidth={2} aria-hidden />
                </button>
              </div>

              <div className={styles.sheetBody}>
                {mosaic.length > 0 && (
                  <div className={styles.galleryWrap} aria-label={ui.boatGalleryAria}>
                    <div
                      ref={galleryRef}
                      onScroll={onGalleryScroll}
                      className={galleryExpanded ? styles.galleryGridAll : styles.galleryGrid}
                    >
                      {(galleryExpanded ? gallery : mosaic).map((img, i) => (
                        <div
                          key={`${img.url}-${i}`}
                          className={!galleryExpanded && i === 0 ? styles.galleryMain : styles.galleryCell}
                        >
                          <Image
                            src={img.url as string}
                            alt={img.alt?.trim() || name}
                            fill
                            className={styles.galleryImg}
                            sizes="(max-width: 768px) 100vw, 400px"
                            placeholder={img.metadata?.lqip ? 'blur' : 'empty'}
                            blurDataURL={img.metadata?.lqip ?? undefined}
                          />
                        </div>
                      ))}
                    </div>

                    {!galleryExpanded && gallery.length > 1 && (
                      <button
                        type="button"
                        className={styles.seeAllBtn}
                        onClick={() => setGalleryExpanded(true)}
                      >
                        <ImageIcon className={styles.seeAllIcon} strokeWidth={2} aria-hidden />
                        {restCount > 0 ? ui.photoGridSeeAllWithExtra(restCount) : ui.photoGridSeeAll}
                      </button>
                    )}

                    {/* Mobil: şeritte kaçıncı görselde olduğunu gösteren
                        noktalar ve sağ altta toplam fotoğraf sayısı rozeti. */}
                    {!galleryExpanded && gallery.length > 1 && (
                      <button
                        type="button"
                        className={styles.countBadge}
                        onClick={() => setGalleryExpanded(true)}
                        aria-label={ui.photoGridMobileSeeAllWithCount(gallery.length)}
                      >
                        <ImageIcon className={styles.countIcon} strokeWidth={2} aria-hidden />
                        {gallery.length}
                      </button>
                    )}

                    {!galleryExpanded && mosaic.length > 1 && (
                      <div className={styles.dots} aria-hidden>
                        {mosaic.map((img, i) => (
                          <span
                            key={`dot-${img.url}-${i}`}
                            className={i === activeSlide ? styles.dotActive : styles.dot}
                          />
                        ))}
                      </div>
                    )}

                  </div>
                )}

                {amenities.length > 0 && (
                  <>
                    <h3 className={styles.blockHeading}>{ui.boatAmenitiesHeading}</h3>
                    <ul className={styles.amenityList}>
                      {amenities.map((a) => (
                        <li key={a} className={styles.amenityItem}>
                          <Check size={18} strokeWidth={2.4} className={styles.amenityIcon} aria-hidden />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {specRows.length > 0 && (
                  <>
                    <h3 className={styles.blockHeading}>{ui.boatSpecsHeading}</h3>
                    <ul className={styles.specList}>
                      {specRows.map((row) => (
                        <li key={row.label} className={styles.specItem}>
                          <row.Icon size={17} strokeWidth={2} className={styles.specIcon} aria-hidden />
                          <span className={styles.specLabel}>{row.label}:</span>
                          <span className={styles.specValue}>{row.value}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>,
          portalEl
        )
      : null

  return (
    <>
      <button type="button" className={styles.row} onClick={() => setOpen(true)}>
        {cover && (
          <span className={styles.thumb}>
            <Image
              src={cover}
              alt={boat.coverImage?.alt?.trim() || name}
              fill
              className={styles.thumbImg}
              sizes="96px"
              placeholder={boat.coverImage?.metadata?.lqip ? 'blur' : 'empty'}
              blurDataURL={boat.coverImage?.metadata?.lqip ?? undefined}
            />
          </span>
        )}

        <span className={styles.rowBody}>
          <span className={styles.eyebrow}>{ui.boatEyebrow}</span>
          <span className={styles.boatName}>{name}</span>
          {metaItems.length > 0 && (
            <span className={styles.metaRow}>
              {metaItems.map((m) => (
                <span key={m.text} className={styles.metaItem}>
                  <m.Icon size={16} strokeWidth={2} className={styles.metaIcon} aria-hidden />
                  {m.text}
                </span>
              ))}
            </span>
          )}
        </span>

        <span className={styles.cta}>
          <span className={styles.ctaLabel}>{ui.boatViewDetails}</span>
          <span className={styles.ctaCircle} aria-hidden>
            <ChevronRight size={20} strokeWidth={2} />
          </span>
        </span>
      </button>

      {modal}
    </>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Clock, MapPin, CalendarDays, Languages, Users, Ship, Utensils } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { urlFor } from '@/lib/sanity'
import type { TourForBooking, TourImageForBooking } from '@/lib/sanity/bookingTypes'
import type { SiteLocale } from '@/lib/i18n/config'
import { getBookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './ReservationTourSnapshot.module.css'

interface ReservationTourSnapshotProps {
  tour: TourForBooking
  locale?: SiteLocale
}

function imageUrl(img: TourImageForBooking | undefined, width: number, height: number): string | null {
  if (img?.asset) {
    try {
      return urlFor(img.asset).width(width).height(height).fit('crop').url()
    } catch {
      /* fall through */
    }
  }
  const raw = img?.url?.trim()
  return raw || null
}

export default function ReservationTourSnapshot({
  tour,
  locale = 'tr',
}: ReservationTourSnapshotProps) {
  const ui = useMemo(() => getBookingWizardUi(locale), [locale])
  const tourUi = useMemo(() => getTourPageUi(locale), [locale])
  const [descOpen, setDescOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  const cover = imageUrl(tour.mainImage, 1200, 750)
  const coverAlt = tour.mainImage?.alt?.trim() || tour.title
  const description = tour.shortDescription?.trim() || ''
  const descLong = description.length > 220

  const facts = useMemo(() => {
    const q = tour.quickFacts
    const rows: { icon: LucideIcon; label: string; value: string }[] = []
    if (q?.durationText?.trim()) {
      rows.push({ icon: Clock, label: tourUi.quickFactDuration, value: q.durationText.trim() })
    }
    if (q?.startTime?.trim()) {
      rows.push({ icon: Ship, label: ui.pageStartTime, value: q.startTime.trim() })
    }
    if (q?.returnTime?.trim()) {
      rows.push({ icon: Clock, label: ui.pageReturnTime, value: q.returnTime.trim() })
    }
    if (q?.meetingLocation?.trim()) {
      rows.push({ icon: MapPin, label: tourUi.quickFactDeparture, value: q.meetingLocation.trim() })
    }
    if (q?.availabilityText?.trim()) {
      rows.push({ icon: CalendarDays, label: tourUi.quickFactAvailability, value: q.availabilityText.trim() })
    }
    if (q?.language?.trim()) {
      rows.push({ icon: Languages, label: tourUi.quickFactLanguage, value: q.language.trim() })
    }
    if (q?.groupType?.trim()) {
      rows.push({ icon: Users, label: tourUi.quickFactGroupType, value: q.groupType.trim() })
    }
    if (q?.maxCapacity && q.maxCapacity > 0) {
      rows.push({
        icon: Users,
        label: tourUi.quickFactCapacity,
        value: tourUi.quickFactCapacityValue(q.maxCapacity),
      })
    }
    return rows
  }, [tour.quickFacts, tourUi, ui.pageStartTime, ui.pageReturnTime])

  const highlights = (tour.highlights ?? []).filter((h) => h?.title?.trim()).slice(0, 4)
  const foodItems = tour.foodMenu?.enabled
    ? (tour.foodMenu.items ?? []).filter((i) => i?.title?.trim())
    : []

  const heading = useMemo(() => {
    const raw = (tour.title ?? '').replace(/\s+/g, ' ').trim()
    if (!raw) return ''
    const primary = raw.split(/\s+[–—|:]\s+/)[0]?.trim() || raw
    if (primary.length <= 56) return primary
    return `${primary.slice(0, 53).trimEnd()}…`
  }, [tour.title])

  return (
    <>
      <div className={styles.cover}>
        {cover ? (
          <Image
            src={cover}
            alt={coverAlt}
            fill
            priority
            className={styles.coverImg}
            sizes="(max-width: 959px) 100vw, 400px"
            placeholder={tour.mainImage?.metadata?.lqip ? 'blur' : 'empty'}
            blurDataURL={tour.mainImage?.metadata?.lqip}
          />
        ) : (
          <div className={styles.coverFallback} aria-hidden />
        )}
        <div className={styles.coverShade} aria-hidden />
        {heading ? (
          <div className={styles.coverCaption}>
            <p className={styles.coverKicker}>{ui.modalTitle}</p>
            <p className={styles.coverTitle}>{heading}</p>
          </div>
        ) : null}
      </div>

      <div className={styles.intro}>
        {description ? (
          <section className={styles.block}>
            <h2 className={styles.heading}>{ui.pageAboutHeading}</h2>
            <p className={descOpen || !descLong ? styles.desc : `${styles.desc} ${styles.descClamp}`}>
              {description}
            </p>
            {descLong ? (
              <button
                type="button"
                className={styles.moreBtn}
                onClick={() => setDescOpen((v) => !v)}
              >
                {descOpen ? tourUi.tourDescriptionShowLess : tourUi.tourDescriptionShowMore}
              </button>
            ) : null}
          </section>
        ) : null}

        {facts.length > 0 ? (
          <section className={styles.block}>
            <h2 className={styles.heading}>{ui.pageFactsHeading}</h2>
            <ul className={styles.facts}>
              {facts.map((f) => {
                const Icon = f.icon
                return (
                  <li key={`${f.label}-${f.value}`} className={styles.fact}>
                    <span className={styles.factIcon} aria-hidden>
                      <Icon size={16} strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className={styles.factLabel}>{f.label}</p>
                      <p className={styles.factValue}>{f.value}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}
      </div>

      {highlights.length > 0 || foodItems.length > 0 ? (
        <div className={styles.details}>
          {highlights.length > 0 ? (
            <section className={styles.block}>
              <h2 className={styles.heading}>{tourUi.highlightsTitle}</h2>
              <ul className={styles.highlights}>
                {highlights.map((h, i) => (
                  <li key={`${h.title}-${i}`}>
                    <p className={styles.hiTitle}>{h.title}</p>
                    {h.description?.trim() ? (
                      <p className={styles.hiDesc}>{h.description.trim()}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {foodItems.length > 0 ? (
            <section className={styles.block}>
              <h2 className={styles.heading}>
                <Utensils size={16} strokeWidth={2} aria-hidden />
                {tour.foodMenu?.sectionTitle?.trim() || tourUi.foodMenuFallbackTitle}
              </h2>
              {tour.foodMenu?.intro?.trim() ? (
                <p className={styles.menuIntro}>{tour.foodMenu.intro.trim()}</p>
              ) : null}
              <ul className={styles.menuList}>
                {foodItems.map((item, index) => {
                  const title = item.title!.trim()
                  const thumb = imageUrl(item.image, 240, 240)
                  const excerpt = item.excerpt?.trim() || ''
                  const open = openMenu === index
                  return (
                    <li key={`${title}-${index}`} className={styles.menuItem}>
                      <div className={styles.menuThumb}>
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt=""
                            fill
                            className={styles.menuThumbImg}
                            sizes="72px"
                            aria-hidden
                          />
                        ) : (
                          <span className={styles.menuThumbPh} aria-hidden>
                            ···
                          </span>
                        )}
                      </div>
                      <div className={styles.menuMain}>
                        <div className={styles.menuTop}>
                          <h3 className={styles.menuTitle}>{title}</h3>
                          {item.priceLabel?.trim() ? (
                            <span className={styles.menuPrice}>{item.priceLabel.trim()}</span>
                          ) : null}
                        </div>
                        {item.metaLine1?.trim() ? (
                          <p className={styles.menuMeta}>{item.metaLine1.trim()}</p>
                        ) : null}
                        {item.metaLine2?.trim() ? (
                          <p className={styles.menuMeta}>{item.metaLine2.trim()}</p>
                        ) : null}
                        {excerpt ? (
                          <>
                            <p className={open ? styles.menuExcerpt : `${styles.menuExcerpt} ${styles.descClamp}`}>
                              {excerpt}
                            </p>
                            <button
                              type="button"
                              className={styles.moreBtn}
                              onClick={() => setOpenMenu(open ? null : index)}
                            >
                              {open ? tourUi.tourDescriptionShowLess : tourUi.foodMenuDetailBtn}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

'use client'

import Image from 'next/image'
import { translateItineraryTag } from '@/lib/i18n/itineraryTags'
import type { SiteLocale } from '@/lib/i18n/config'
import { useEffect, useRef, useState } from 'react'
import styles from './ItineraryTimeline.module.css'

export interface ItineraryTimelineItem {
  title: string
  description?: string | null
  time?: string | null
  tag?: string | null
  imageUrl?: string | null
  imageBlurDataURL?: string | null
}

interface ItineraryTimelineProps {
  items?: ItineraryTimelineItem[] | null
  sectionTitle?: string
  locale?: SiteLocale
}

export default function ItineraryTimeline({
  items,
  sectionTitle = 'Neler yapacaksınız?',
  locale = 'tr',
}: ItineraryTimelineProps) {
  if (!items || items.length === 0) return null

  const validItems = items.filter((item) => item.imageUrl && item.title)
  if (validItems.length === 0) return null

  return (
    <ItineraryTimelineClient
      validItems={validItems}
      sectionTitle={sectionTitle}
      locale={locale}
    />
  )
}

function ItineraryTimelineClient({
  validItems,
  sectionTitle,
  locale,
}: {
  validItems: ItineraryTimelineItem[]
  sectionTitle: string
  locale: SiteLocale
}) {
  const [visible, setVisible] = useState<boolean[]>(() => validItems.map(() => false))
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const observers = validItems.map((_, index) => {
      const el = itemRefs.current[index]
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          // Her iki yönde çalışır: aşağı scroll → true, yukarı scroll → false
          setVisible((prev) => {
            if (prev[index] === entry.isIntersecting) return prev
            const next = [...prev]
            next[index] = entry.isIntersecting
            return next
          })
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach((obs) => obs?.disconnect())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validItems.length])

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      <div className={styles.timeline}>
        <ul className={styles.list}>
          {validItems.map((item, index) => (
            <li
              key={index}
              ref={(el) => { itemRefs.current[index] = el }}
              className={`${styles.item} ${visible[index] ? styles.itemVisible : styles.itemHidden}`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <div className={styles.left}>
                <div className={styles.thumb}>
                  <Image
                    src={item.imageUrl!}
                    alt={item.title}
                    fill
                    className={styles.image}
                    placeholder={item.imageBlurDataURL ? 'blur' : 'empty'}
                    blurDataURL={item.imageBlurDataURL ?? undefined}
                  />
                  {item.time && <span className={styles.badgeTime}>{item.time}</span>}
                  {item.tag && (
                    <span className={styles.badgeTag}>
                      {translateItineraryTag(item.tag, locale)}
                    </span>
                  )}
                </div>

              </div>
              <div className={styles.right}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                {item.description && <p className={styles.itemDesc}>{item.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

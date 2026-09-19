'use client'

import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import styles from './YachtHeroBadgeOverlay.module.css'

interface YachtHeroBadgeOverlayProps {
  badges: string[]
  locale?: SiteLocale
}

/** Tur kartı «En Popüler» şeridi ile aynı dilimli ribbon stili */
export default function YachtHeroBadgeOverlay({ badges, locale = 'tr' }: YachtHeroBadgeOverlayProps) {
  const list = badges.map((b) => b.trim()).filter(Boolean)
  if (list.length === 0) return null

  return (
    <ul className={styles.list} aria-label={getYachtUi(locale).featuresAriaLabel}>
      {list.map((b, i) => (
        <li key={`${i}-${b}`} className={styles.ribbon}>
          <span className={styles.ribbonText}>{b}</span>
        </li>
      ))}
    </ul>
  )
}
